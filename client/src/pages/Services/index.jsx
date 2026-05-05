import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Services.module.css';
import serviceImg1 from '../../assets/images/service1.png';
import serviceImg2 from '../../assets/images/service2.png';
import serviceImg3 from '../../assets/images/service3.png';

export default function Services() {
  const services = [
    {
      id: 1,
      title: 'Phun Thêu Thẩm Mỹ',
      desc: 'Kiến tạo đường nét mày, môi, mí sắc sảo nhưng vẫn giữ được sự tự nhiên vốn có của khuôn mặt.',
      image: serviceImg1,
      price: 'Từ 1.500.000đ'
    },
    {
      id: 2,
      title: 'Chăm Sóc Da Chuyên Sâu',
      desc: 'Liệu trình phục hồi chuyên sâu, đánh thức làn da rạng rỡ, căng bóng từ bên trong với công nghệ tiên tiến.',
      image: serviceImg2,
      price: 'Từ 500.000đ'
    },
    {
      id: 3,
      title: 'Massage Thư Giãn',
      desc: 'Giải tỏa căng thẳng, cân bằng thân - tâm - trí với kỹ thuật massage đá nóng và tinh dầu organic.',
      image: serviceImg3,
      price: 'Từ 350.000đ'
    },
    {
      id: 4,
      title: 'Trị Mụn Tận Gốc',
      desc: 'Phác đồ điều trị cá nhân hóa giúp loại bỏ tận gốc các loại mụn, trả lại làn da mịn màng, khỏe mạnh.',
      image: serviceImg2, // Reusing image temporarily
      price: 'Từ 800.000đ'
    },
    {
      id: 5,
      title: 'Tắm Trắng Phi Thuyền',
      desc: 'Làm bật tông da toàn thân an toàn, hiệu quả tức thì nhờ công nghệ ánh sáng hồng ngoại tiên tiến.',
      image: serviceImg1, // Reusing image temporarily
      price: 'Từ 2.000.000đ'
    },
    {
      id: 6,
      title: 'Triệt Lông Vĩnh Viễn',
      desc: 'Sử dụng công nghệ Diode Laser lạnh, không đau rát, hiệu quả lâu dài và an toàn cho mọi vùng da.',
      image: serviceImg3, // Reusing image temporarily
      price: 'Từ 200.000đ'
    }
  ];

  return (
    <div className={styles.servicesWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Dịch Vụ Của Chúng Tôi</h1>
          <p className={styles.heroSubtitle}>
            Khám phá các giải pháp làm đẹp toàn diện, kết hợp giữa kỹ thuật tinh xảo và dòng sản phẩm cao cấp nhất.
          </p>
        </div>
      </section>

      <section className={styles.servicesSection}>
        <div className={styles.container}>
          <div className={styles.servicesGrid}>
            {services.map(service => (
              <div key={service.id} className={styles.serviceCard}>
                <div className={styles.serviceImg}>
                  <img src={service.image} alt={service.title} />
                  <div className={styles.priceTag}>{service.price}</div>
                </div>
                <div className={styles.serviceInfo}>
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                  <Link to="/booking" className={styles.btnBook}>
                    Đặt Lịch Ngay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2>Bạn Cần Tư Vấn Thêm?</h2>
            <p>Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng lắng nghe và đưa ra giải pháp phù hợp nhất cho làn da của bạn.</p>
            <Link to="/booking" className={styles.btnPrimary}>Liên Hệ Ngay</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
