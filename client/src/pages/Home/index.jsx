import styles from './Home.module.css';
import serviceImg1 from '../../assets/images/service1.png';
import serviceImg2 from '../../assets/images/service2.png';
import serviceImg3 from '../../assets/images/service3.png';

export default function Home() {
  return (
    <div className={styles.homeWrapper}>
      <section className={styles.hero} id="home">
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Nét Đẹp Tự Nhiên,<br />Hoàn Mỹ Từng Chi Tiết.
            </h1>
            <p className={styles.heroSubtitle}>
              Kiến tạo vẻ đẹp độc bản cho mỗi người phụ nữ Việt bằng công nghệ hiện đại và tâm huyết từ chuyên gia hàng đầu.
            </p>
            <div className={styles.heroButtons}>
              <a href="#services" className={styles.btnPrimary}>
                Xem Dịch Vục
              </a>
              <a href="#book" className={styles.btnSecondary}>
                Đặt Lịch Ngay
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.statItem}>
          <h4>10+</h4>
          <p>Năm Kinh Nghiệm</p>
        </div>
        <div className={styles.statItem}>
          <h4>15k+</h4>
          <p>Khách Hàng Hài Lòng</p>
        </div>
        <div className={styles.statItem}>
          <h4>20+</h4>
          <p>Chuyên Gia Tận Tâm</p>
        </div>
        <div className={styles.statItem}>
          <h4>100%</h4>
          <p>Cam Kết Chất Lượng</p>
        </div>
      </section>

      <section className={styles.services} id="services">
        <div className={styles.sectionHeader}>
          <h2>Dịch Vụ Nổi Bật</h2>
          <p>
            Chúng tôi mang đến giải pháp làm đẹp toàn diện, kết hợp giữa kỹ thuật tinh xảo và dòng sản phẩm cao cấp nhất.
          </p>
        </div>

        <div className={styles.servicesGrid}>
          {/* Service 1 */}
          <div className={styles.serviceCard}>
            <div className={styles.serviceImg}>
              <img
                src={serviceImg1}
                alt="Phun Thêu Thẩm Mỹ"
              />
            </div>
            <div className={styles.serviceInfo}>
              <h3>Phun Thêu Thẩm Mỹ</h3>
              <p>Kiến tạo đường nét mày, môi, mí sắc sảo nhưng vẫn giữ được sự tự nhiên vốn có của khuôn mặt.</p>
              <a
                href="#"
                className="btn-book"
                style={{ border: "none", borderBottom: "1px solid var(--primary)", padding: "5px 0" }}
              >
                Tìm Hiểu Thêm
              </a>
            </div>
          </div>

          {/* Service 2 */}
          <div className={styles.serviceCard}>
            <div className={styles.serviceImg}>
              <img
                src={serviceImg2}
                alt="Chăm Sóc Da"
              />
            </div>
            <div className={styles.serviceInfo}>
              <h3>Chăm Sóc Da</h3>
              <p>Liệu trình phục hồi chuyên sâu, đánh thức làn da rạng rỡ, căng bóng từ bên trong với công nghệ Nano.</p>
              <a
                href="#"
                className="btn-book"
                style={{ border: "none", borderBottom: "1px solid var(--primary)", padding: "5px 0" }}
              >
                Tìm Hiểu Thêm
              </a>
            </div>
          </div>

          {/* Service 3 */}
          <div className={styles.serviceCard}>
            <div className={styles.serviceImg}>
              <img
                src={serviceImg3}
                alt="Massage Thư Giãn"
              />
            </div>
            <div className={styles.serviceInfo}>
              <h3>Massage Thư Giãn</h3>
              <p>Giải tỏa căng thẳng, cân bằng thân - tâm - trí với kỹ thuật massage đá nóng và tinh dầu organic.</p>
              <a
                href="#"
                className="btn-book"
                style={{ border: "none", borderBottom: "1px solid var(--primary)", padding: "5px 0" }}
              >
                Tìm Hiểu Thêm
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



