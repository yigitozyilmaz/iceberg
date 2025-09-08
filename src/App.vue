<template>
  <div class="container mx-auto p-4">
    <div v-if="loading" class="text-center py-10">Loading...</div>
    <div v-else-if="error" class="text-red-500">
      {{ error }}
    </div>
    <div v-else>
      <h1 class="text-2xl font-bold mb-4">Randevular</h1>

      <DataTable
        :value="appointments"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column field="appointment_id" header="ID" sortable></Column>
        <Column field="appointment_date" header="Tarih" sortable>
          <template #body="slotProps">
            {{
              new Date(slotProps.data.appointment_date).toLocaleString("tr-TR")
            }}
          </template>
        </Column>
        <Column field="appointment_address" header="Adres" sortable></Column>
        <Column field="contact_name" header="İsim" sortable></Column>
        <Column field="contact_surname" header="Soyisim" sortable></Column>
        <Column field="contact_email" header="Email" sortable></Column>
        <Column field="is_cancelled" header="Durum" sortable>
          <template #body="slotProps">
            <span
              :class="[
                'px-2 py-1 rounded text-sm',
                slotProps.data.is_cancelled
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800',
              ]"
            >
              {{ slotProps.data.is_cancelled ? "İptal Edildi" : "Aktif" }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import { AppointmentService } from "./services";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

export default {
  name: "App",
  components: {
    DataTable,
    Column,
  },
  data() {
    return {
      appointments: [],
      loading: true,
      error: null,
    };
  },
  async mounted() {
    try {
      const response = await AppointmentService.getAll();
      console.log("API Response:", response);
      this.appointments = response.map((record) => ({
        ...record.fields,
        id: record.id,
      }));
    } catch (error) {
      console.error("Error:", error);
      this.error = error.message || "Bir hata oluştu";
    } finally {
      this.loading = false;
    }
  },
};
</script>

<style>
@import "./style.css";
/* PrimeVue stilleri */
@import "primevue/resources/themes/lara-light-blue/theme.css";
@import "primevue/resources/primevue.min.css";
@import "primeicons/primeicons.css";
</style>
