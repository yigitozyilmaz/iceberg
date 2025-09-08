# Iceberg - Emlak Randevu Yönetim Sistemi

Bu proje, emlakçı çalışanlarının sistemlerinde kayıtlı olan kişilere evleri gezdirmelerini sağlayan randevu işlemlerini yönetmek için geliştirilmiş bir web uygulamasıdır.

## Özellikler

- Randevu listeleme ve filtreleme
- Randevu oluşturma ve düzenleme
- Kişi ve emlakçı yönetimi
- Responsive tasarım
- Airtable entegrasyonu

## Teknolojiler

- Vue 3 (Options API)
- PrimeVue
- Tailwind CSS
- Airtable API

## Kurulum

1. Repoyu klonlayın:
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/iceberg.git
cd iceberg
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
yarn install
\`\`\`

3. .env dosyasını oluşturun:
\`\`\`env
VITE_AIRTABLE_API_URL=your_airtable_api_url
VITE_AIRTABLE_API_KEY=your_airtable_api_key
\`\`\`

4. Geliştirme sunucusunu başlatın:
\`\`\`bash
yarn dev
\`\`\`

## Kullanım

- Randevuları listelemek için ana sayfayı kullanın
- Yeni randevu oluşturmak için "Randevu Oluştur" butonunu kullanın
- Randevuları düzenlemek için ilgili randevuya tıklayın

## Katkıda Bulunma

1. Bu repoyu fork edin
2. Feature branch oluşturun (\`git checkout -b feature/amazing-feature\`)
3. Değişikliklerinizi commit edin (\`git commit -m 'Add some amazing feature'\`)
4. Branch'inizi push edin (\`git push origin feature/amazing-feature\`)
5. Pull Request oluşturun