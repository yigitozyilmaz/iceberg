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
## Live
https://iceberg-iota.vercel.app

## Projenin açıklaması
Randevular, sayfa açıldığında tablo üzerinden görüntülenmektedir. Tüm randevu verileri tablo yüklenmeden önce API’den çekilir ve önyüzde sayfalama (pagination) uygulanır. Tablo satır sayısı kullanıcı tarafından seçilebilir (varsayılan: 10). Sayfa açılmadan önce ayrıca Agent ve Contact verileri de yüklenmektedir. Agent’ların renk ve baş harf eşleştirmeleri store üzerinden yönetilmektedir.

Tablonun filtreleme bölümünde; randevular, atanan agentlara, statü durumuna, tarih aralığına veya contact bilgisine göre aranabilir ve listelenebilir.

Yeni randevu oluşturmak için Create Appointment butonuna basılır. Bu aşamada bir contact seçilir, adres girilir, ardından agent seçimi ve randevu zamanı belirlenerek kayıt tamamlanır.

Düzenleme için, tablodan ilgili randevu seçilir ve istenilen alanlarda değişiklik yapılabilir. Edit ekranında ayrıca müşteriye ait ilgili randevular (related appointments) listelenmektedir.

Arayüz, mobil ve tablet cihazlar için tam uyumlu (responsive) çalışmaktadır.

## Project Description

Appointments are displayed in a table when the page is opened. All appointment data is fetched from the API before the table is rendered, and front-end pagination is applied. The number of rows per page can be selected by the user (default: 10). Before the page loads, both Agent and Contact data are also retrieved. Agent color and initial mappings are managed via the store.

The filter section of the table allows searching and listing appointments based on assigned agents, status, date range, or contact information.

To create a new appointment, click the Create Appointment button. At this stage, a contact must be selected, an address must be entered, followed by agent selection and appointment time to complete the process.

For editing, the desired appointment can be selected directly from the table, and the necessary fields can be updated. The Edit screen also displays related appointments, showing other appointments belonging to the same customer.

The interface is fully responsive and optimized for both mobile and tablet devices.

