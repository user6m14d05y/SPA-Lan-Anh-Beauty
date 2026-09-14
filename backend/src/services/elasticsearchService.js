const esNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const INDEX_NAME = 'blog_posts';

let client = null;
let clientInitialized = false;

const getClient = async () => {
  if (clientInitialized) return client;
  clientInitialized = true;
  try {
    const { Client } = await import('@elastic/elasticsearch');
    client = new Client({
      node: esNode,
      requestTimeout: 1000,
      maxRetries: 0,
    });
  } catch (err) {
    client = null;
  }
  return client;
};

const fetchWithTimeout = async (url, options = {}, ms = 300) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
};

export const encodeCursor = (cursorValues) => {
  if (!cursorValues || !Array.isArray(cursorValues)) return null;
  try {
    return Buffer.from(JSON.stringify(cursorValues)).toString('base64');
  } catch (err) {
    return null;
  }
};

export const decodeCursor = (cursorStr) => {
  if (!cursorStr) return null;
  try {
    const jsonStr = Buffer.from(cursorStr, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
};

export const elasticsearchService = {
  async isConnected() {
    const esClient = await getClient();
    if (!esClient) return false;
    try {
      const res = await fetchWithTimeout(esNode, {}, 300);
      return Boolean(res && (res.ok || res.status === 200 || res.status === 401));
    } catch (err) {
      return false;
    }
  },

  async initIndex() {
    try {
      if (!(await this.isConnected())) return false;
      const exists = await client.indices.exists({ index: INDEX_NAME });
      if (!exists) {
        await client.indices.create({
          index: INDEX_NAME,
          body: {
            mappings: {
              properties: {
                id: { type: 'integer' },
                title: { type: 'text', analyzer: 'standard' },
                slug: { type: 'keyword' },
                excerpt: { type: 'text' },
                content: { type: 'text' },
                imageUrl: { type: 'keyword' },
                categorySlug: { type: 'keyword' },
                categoryName: { type: 'keyword' },
                authorName: { type: 'text' },
                status: { type: 'keyword' },
                isFeatured: { type: 'boolean' },
                publishedAt: { type: 'date' },
                viewCount: { type: 'integer' },
                sortOrder: { type: 'integer' },
                readingTimeMinutes: { type: 'integer' },
              },
            },
          },
        });
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  async indexPost(post) {
    try {
      if (!post || !(await this.isConnected())) return false;
      const doc = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        imageUrl: post.imageUrl || post.coverImageUrl,
        categorySlug: post.category?.slug || post.categorySlug || null,
        categoryName: post.category?.name || post.categoryName || null,
        authorName: post.author?.fullName || post.authorName || 'Lan Anh Beauty',
        status: post.status,
        isFeatured: Boolean(post.isFeatured),
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
        viewCount: Number(post.viewCount || 0),
        sortOrder: Number(post.sortOrder || 0),
        readingTimeMinutes: Number(post.readingTimeMinutes || 5),
      };

      await client.index({
        index: INDEX_NAME,
        id: String(post.id),
        document: doc,
      });
      return true;
    } catch (err) {
      return false;
    }
  },

  async deletePost(postId) {
    try {
      if (!postId || !(await this.isConnected())) return false;
      await client.delete({
        index: INDEX_NAME,
        id: String(postId),
      });
      return true;
    } catch (err) {
      return false;
    }
  },

  async searchPostsWithCursor({ q, categorySlug, sort = 'newest', cursor, limit = 10 }) {
    try {
      const connected = await this.isConnected();
      if (!connected) return null;

      const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
      const searchAfter = decodeCursor(cursor);

      const mustFilters = [
        { term: { status: 'PUBLISHED' } },
        { range: { publishedAt: { lte: 'now' } } },
      ];

      if (categorySlug?.trim()) {
        mustFilters.push({ term: { categorySlug: String(categorySlug).trim() } });
      }

      let query = { bool: { must: mustFilters } };

      if (q?.trim()) {
        const searchTerm = q.trim();
        query.bool.must.push({
          multi_match: {
            query: searchTerm,
            fields: ['title^3', 'excerpt^2', 'content'],
            fuzziness: 'AUTO',
          },
        });
      }

      let sortClause = [];
      const normalizedSort = String(sort).toLowerCase();

      if (normalizedSort === 'oldest') {
        sortClause = [
          { publishedAt: { order: 'asc' } },
          { id: { order: 'asc' } },
        ];
      } else if (normalizedSort === 'popular') {
        sortClause = [
          { viewCount: { order: 'desc' } },
          { publishedAt: { order: 'desc' } },
          { id: { order: 'desc' } },
        ];
      } else {
        sortClause = [
          { isFeatured: { order: 'desc' } },
          { publishedAt: { order: 'desc' } },
          { id: { order: 'desc' } },
        ];
      }

      const body = {
        query,
        sort: sortClause,
        size: parsedLimit + 1,
      };

      if (searchAfter) {
        body.search_after = searchAfter;
      }

      const response = await client.search({
        index: INDEX_NAME,
        body,
      });

      const hits = response.hits?.hits || [];
      const hasMore = hits.length > parsedLimit;
      const resultHits = hasMore ? hits.slice(0, parsedLimit) : hits;

      const items = resultHits.map((hit) => {
        const source = hit._source;
        return {
          id: source.id,
          title: source.title,
          slug: source.slug,
          excerpt: source.excerpt,
          imageUrl: source.imageUrl,
          coverImageUrl: source.imageUrl,
          categoryName: source.categoryName,
          categorySlug: source.categorySlug,
          category: source.categorySlug ? { name: source.categoryName, slug: source.categorySlug } : null,
          authorName: source.authorName,
          publishedAt: source.publishedAt,
          readingTimeMinutes: source.readingTimeMinutes,
          viewCount: source.viewCount,
          isFeatured: source.isFeatured,
        };
      });

      let nextCursor = null;
      if (hasMore && resultHits.length > 0) {
        const lastHit = resultHits[resultHits.length - 1];
        nextCursor = encodeCursor(lastHit.sort);
      }

      return {
        items,
        pagination: {
          nextCursor,
          hasMore,
          limit: parsedLimit,
          isElasticsearch: true,
        },
      };
    } catch (err) {
      return null;
    }
  },
};

export default elasticsearchService;
