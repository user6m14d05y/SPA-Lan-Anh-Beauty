export function makeContact(overrides = {}) {
  const now = new Date();

  return {
    name: 'Khach Hang Test',
    email: `contact${Date.now()}@example.com`,
    phone: '0900000000',
    message: 'Toi can tu van them ve dich vu.',
    status: 'NEW',
    replyMessage: null,
    repliedAt: null,
    repliedBy: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
