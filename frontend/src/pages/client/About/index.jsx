import React from 'react';
import { SparklesIcon, HeartIcon, ShieldCheckIcon } from '../../../icons';
import styles from './About.module.css';
import aboutImg from '../../../assets/images/About-lan-anh.jpg';

export default function About() {
  return (
    <div className={styles.aboutWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3">Về Chúng Tôi</span>
          <h1 className={styles.heroTitle}>Lan Anh Beauty SPA</h1>
          <p className={styles.heroSubtitle}>
            Hành trình hơn 10 năm kiến tạo vẻ đẹp tự nhiên, hoàn mỹ cho phái đẹp Việt bằng tâm huyết, sự chỉn chu và công nghệ làm đẹp tiên tiến.
          </p>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyContent}>
            <span className="eyebrow-badge mb-3">Hành Trình Thương Hiệu</span>
            <h2 className={styles.sectionTitle}>Câu Chuyện Của Lan Anh Beauty</h2>
            <p className={styles.sectionDesc}>
              Được thành lập từ tâm huyết "Đánh thức vẻ đẹp độc bản" trong mỗi người phụ nữ, Lan Anh Beauty ra đời với mong muốn mang lại các giải pháp làm đẹp an toàn, hiệu quả chuẩn y khoa và thư giãn tuyệt đối.
            </p>
            <p className={styles.sectionDesc}>
              Trải qua hành trình không ngừng đổi mới, chúng tôi tự hào sở hữu hệ thống trang thiết bị đạt chứng nhận FDA, quy tụ các bác sĩ và chuyên gia thẩm mỹ hàng đầu. Lan Anh Beauty không chỉ là nơi làm đẹp mà còn là không gian phục hồi năng lượng tinh thần cho phái đẹp sau những ồn ào cuộc sống.
            </p>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <h3>10+</h3>
                <p>Năm Kinh Nghiệm</p>
              </div>
              <div className={styles.statItem}>
                <h3>15k+</h3>
                <p>Khách Hàng Hài Lòng</p>
              </div>
              <div className={styles.statItem}>
                <h3>50+</h3>
                <p>Giải Thưởng Đạt Được</p>
              </div>
            </div>
          </div>
          <div className={styles.storyImage}>
            <div className="bezel-shell">
              <div className="bezel-inner overflow-hidden">
                <img src={aboutImg} alt="Câu Chuyện Lan Anh Beauty" className={styles.storyImg} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <div className={styles.valuesHeader}>
            <span className="eyebrow-badge mb-3">Triết Lý Hoạt Động</span>
            <h2 className={styles.sectionTitle}>Giá Trị Cốt Lõi</h2>
            <p className={styles.sectionDesc}>Những nguyên tắc kim chỉ nam định hướng mọi dịch vụ tại Lan Anh Beauty để mang tới trải nghiệm trọn vẹn nhất.</p>
          </div>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><SparklesIcon className="w-9 h-9 text-[var(--primary-gold-dark)]" /></div>
              <h3>Chất Lượng Thật</h3>
              <p>Cam kết sử dụng công nghệ tiên tiến, mỹ phẩm chính hãng cao cấp, mang lại kết quả duy trì lâu dài và rõ rệt.</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><HeartIcon className="w-9 h-9 text-[var(--primary-gold-dark)]" /></div>
              <h3>Tận Tâm Phục Vụ</h3>
              <p>Phục vụ bằng cả sự chân thành, luôn lắng nghe nhu cầu thực sự của khách hàng để đưa ra phác đồ tối ưu.</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}><ShieldCheckIcon className="w-9 h-9 text-[var(--primary-gold-dark)]" /></div>
              <h3>An Toàn Tuyệt Đối</h3>
              <p>Tuân thủ nghiêm ngặt tiêu chuẩn vô trùng y tế, dụng cụ riêng biệt cho từng khách hàng, đảm bảo an tâm 100%.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

