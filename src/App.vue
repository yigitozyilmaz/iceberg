<template>
  <div class="min-h-screen">
    <!-- Main Content -->
    <main class="w-full">
      <AppointmentList
        :appointments="appointments"
        :agents="agents"
        :loading="loading"
        @new-appointment="showModal = true"
        @edit-appointment="editAppointment"
      />
    </main>

    <!-- Modal -->
    <AppointmentModal
      v-model="showModal"
      :appointment="selectedAppointment"
      :loading="saving"
      :agents="agents"
      :agent-color-by-code="agentsStore.colorByCode"
      :agent-color-by-name="agentsStore.colorByName"
      @save="saveAppointment"
      @update:modelValue="onModalClose"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script>
import { useAgentsStore } from "./store/agents";
import AppointmentList from "./components/appointments/AppointmentList.vue";
import AppointmentModal from "./components/appointments/AppointmentModal.vue";
import { AppointmentService } from "./api/services/appointment.service";
import { AgentService } from "./api/services/agent.service";

export default {
  name: "App",
  components: {
    AppointmentList,
    AppointmentModal,
  },
  data() {
    return {
      appointments: [],
      agents: [],
      loading: true,
      saving: false,
      showModal: false,
      selectedAppointment: null,
    };
  },
  methods: {
    async loadAppointments() {
      try {
        this.loading = true;
        // API'den tüm appointment listesini al (frontend'te sıralanacak)
        const response = await AppointmentService.getAllAppointments();
        this.appointments = response.data;
      } catch (error) {
        this.$toast.add({
          severity: "error",
          summary: this.$t("common.error"),
          detail: this.$t("appointments.messages.loadError"),
          life: 3000,
        });
      } finally {
        this.loading = false;
      }
    },
    async loadAgents() {
      try {
        const response = await AgentService.getAgents();
        this.agents = response.data || [];
        // sync to store
        const store = useAgentsStore();
        store.setAgents(this.agents);
      } catch (error) {
        this.agents = [];
      }
    },
    editAppointment(appointment) {
      this.selectedAppointment = appointment;
      this.showModal = true;
    },
    onModalClose(isOpen) {
      this.showModal = isOpen;
      // Modal kapandığında selectedAppointment'ı temizle
      if (!isOpen) {
        this.selectedAppointment = null;
      }
    },
    async saveAppointment(formData) {
      try {
        this.saving = true;
        if (this.selectedAppointment) {
          await AppointmentService.updateAppointment(
            this.selectedAppointment.id,
            formData
          );
          this.$toast.add({
            severity: "success",
            summary: this.$t("common.success"),
            detail: this.$t("appointments.messages.updateSuccess"),
            life: 3000,
          });
        } else {
          await AppointmentService.createAppointment(formData);
          this.$toast.add({
            severity: "success",
            summary: this.$t("common.success"),
            detail: this.$t("appointments.messages.createSuccess"),
            life: 3000,
          });
        }
        await this.loadAppointments();
        this.selectedAppointment = null;
        this.showModal = false;
      } catch (error) {
        this.$toast.add({
          severity: "error",
          summary: this.$t("common.error"),
          detail: this.$t("appointments.messages.saveError"),
          life: 3000,
        });
      } finally {
        this.saving = false;
      }
    },
  },
  computed: {
    agentsStore() {
      return useAgentsStore();
    },
  },
  async mounted() {
    await Promise.all([this.loadAppointments(), this.loadAgents()]);
  },
};
</script>

<style>
@import "./style.css";
@import "primevue/resources/themes/lara-light-blue/theme.css";
@import "primevue/resources/primevue.min.css";
@import "primeicons/primeicons.css";
</style>
