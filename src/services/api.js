import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_AIRTABLE_API_URL,
    headers: {
        Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
    },
});

export const appointmentApi = {
    async getAll({ page = 1, perPage = 10, filters = {} } = {}) {
        // Airtable filtreleme formüllerini oluştur
        let filterFormulas = [];

        // Status filtresi
        if (filters.status) {
            switch (filters.status) {
                case 'upcoming':
                    filterFormulas.push("AND(NOT({is_cancelled}), IS_AFTER({appointment_date}, NOW()))");
                    break;
                case 'completed':
                    filterFormulas.push("AND(NOT({is_cancelled}), IS_BEFORE({appointment_date}, NOW()))");
                    break;
                case 'cancelled':
                    filterFormulas.push("{is_cancelled}");
                    break;
            }
        }

        // Tarih aralığı filtresi
        if (filters.dateRange?.start && filters.dateRange?.end) {
            filterFormulas.push(`AND(
        IS_AFTER({appointment_date}, '${filters.dateRange.start}'),
        IS_BEFORE({appointment_date}, '${filters.dateRange.end}')
      )`);
        }

        // Arama filtresi
        if (filters.search) {
            filterFormulas.push(`OR(
        SEARCH('${filters.search.toLowerCase()}', LOWER({appointment_address})),
        SEARCH('${filters.search.toLowerCase()}', LOWER({contact_name})),
        SEARCH('${filters.search.toLowerCase()}', LOWER({contact_email}))
      )`);
        }

        // Tüm filtreleri birleştir
        const finalFilter = filterFormulas.length > 0
            ? `AND(${filterFormulas.join(',')})`
            : undefined;

        // Airtable pagination parametreleri
        const offset = (page - 1) * perPage;

        const params = {
            pageSize: perPage,
            offset: offset || undefined,
            sort: [{ field: 'appointment_date', direction: 'desc' }],
            ...(finalFilter && { filterByFormula: finalFilter })
        };

        try {
            const { data } = await api.get("/Appointments", { params });

            return {
                data: data.records.map(record => ({
                    id: record.id,
                    ...record.fields
                })),
                pagination: {
                    offset: data.offset,
                    total: data.records.length, // Airtable toplam sayıyı vermediği için mevcut kayıt sayısını kullanıyoruz
                    hasMore: !!data.offset // Offset varsa daha fazla kayıt var demektir
                }
            };
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    async create(formData) {
        const { data } = await api.post("/Appointments", {
            records: [{
                fields: {
                    appointment_date: formData.appointment_date.toISOString(),
                    appointment_address: formData.appointment_address,
                    contact_name: formData.contact_name,
                    contact_email: formData.contact_email,
                    is_cancelled: formData.is_cancelled
                }
            }]
        });
        return data;
    },

    async update(id, formData) {
        const { data } = await api.patch(`/Appointments`, {
            records: [{
                id,
                fields: {
                    appointment_date: formData.appointment_date.toISOString(),
                    appointment_address: formData.appointment_address,
                    contact_name: formData.contact_name,
                    contact_email: formData.contact_email,
                    is_cancelled: formData.is_cancelled
                }
            }]
        });
        return data;
    }
};