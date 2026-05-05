import React from 'react';
import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.aboutWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Về Chúng Tôi</h1>
          <p className={styles.heroSubtitle}>
            Hành trình kiến tạo vẻ đẹp tự nhiên, hoàn mỹ cho hàng triệu phụ nữ Việt Nam bằng tâm huyết và công nghệ hiện đại.
          </p>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyContent}>
            <h2 className={styles.sectionTitle}>Câu Chuyện Của Lan Anh Beauty</h2>
            <p className={styles.sectionDesc}>
              Được thành lập từ năm 2010, Lan Anh Beauty ra đời với sứ mệnh "Đánh thức vẻ đẹp tiềm ẩn" trong mỗi người phụ nữ. Chúng tôi tin rằng, mỗi người sinh ra đều mang một nét đẹp riêng, và nhiệm vụ của chúng tôi là giúp nét đẹp ấy tỏa sáng một cách tự nhiên nhất.
            </p>
            <p className={styles.sectionDesc}>
              Trải qua hơn 10 năm phát triển, từ một cơ sở nhỏ, Lan Anh Beauty đã vươn lên trở thành một trong những trung tâm thẩm mỹ uy tín hàng đầu, là nơi gửi trọn niềm tin của hàng ngàn khách hàng. Chúng tôi không ngừng cập nhật các công nghệ tiên tiến nhất và đào tạo đội ngũ chuyên gia tận tâm.
            </p>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <h3>10+</h3>
                <p>Năm Kinh Nghiệm</p>
              </div>
              <div className={styles.statItem}>
                <h3>15k+</h3>
                <p>Khách Hàng</p>
              </div>
              <div className={styles.statItem}>
                <h3>50+</h3>
                <p>Giải Thưởng</p>
              </div>
            </div>
          </div>
          <div className={styles.storyImage}>
            <div className={styles.imagePlaceholder}></div>
          </div>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <div className={styles.valuesHeader}>
            <h2 className={styles.sectionTitle}>Giá Trị Cốt Lõi</h2>
            <p className={styles.sectionDesc}>Những nguyên tắc định hướng mọi hoạt động tại Lan Anh Beauty để mang đến trải nghiệm tuyệt vời nhất cho khách hàng.</p>
          </div>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💎</div>
              <h3>Chất Lượng</h3>
              <p>Cam kết sử dụng công nghệ tiên tiến và sản phẩm cao cấp nhất trong mọi liệu trình, đảm bảo hiệu quả rõ rệt.</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💖</div>
              <h3>Tận Tâm</h3>
              <p>Phục vụ khách hàng bằng cả trái tim, luôn lắng nghe và thấu hiểu để đáp ứng mọi nhu cầu làm đẹp.</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🌿</div>
              <h3>An Toàn</h3>
              <p>Tuân thủ nghiêm ngặt các tiêu chuẩn y tế, dụng cụ vô khuẩn, đảm bảo an toàn tuyệt đối cho mọi khách hàng.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
