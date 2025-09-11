<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    :header="isEdit ? $t('appointments.edit') : $t('appointments.new')"
    :modal="true"
    :style="{ width: '32rem', maxWidth: '95vw' }"
    class="appointment-modal"
  >
    <div class="grid grid-cols-1 gap-3 p-4">
      <!-- Tarih ve Saat -->
      <div class="space-y-1">
        <Calendar
          v-model="formData.appointment_date"
          showTime
          dateFormat="dd/mm/yy"
          :showIcon="true"
          class="w-full custom-calendar"
          :placeholder="$t('appointments.placeholders.date')"
          :class="{ 'p-invalid': errors.appointment_date }"
        />
        <small v-if="errors.appointment_date" class="p-error">{{
          errors.appointment_date
        }}</small>
      </div>

      <!-- Adres -->
      <div class="space-y-1">
        <InputText
          v-model="formData.appointment_address"
          class="w-full custom-input"
          :class="{ 'p-invalid': errors.appointment_address }"
          :placeholder="$t('appointments.placeholders.address')"
        />
        <small v-if="errors.appointment_address" class="p-error">{{
          errors.appointment_address
        }}</small>
      </div>

      <!-- Contact Search -->
      <div class="space-y-1">
        <AutoComplete
          v-model="selectedContact"
          :suggestions="contactSuggestions"
          @complete="searchContacts"
          @item-select="onContactSelect"
          field="display"
          :placeholder="$t('appointments.placeholders.searchContact')"
          class="w-full custom-input"
          :class="{ 'p-invalid': errors.contact }"
          :loading="searchingContacts"
          forceSelection
        />
        <small v-if="errors.contact" class="p-error">{{
          errors.contact
        }}</small>

        <!-- Selected Contact Display -->
        <div
          v-if="formData.contact_id"
          class="bg-gray-50 p-3 rounded-md text-sm"
        >
          <div class="font-medium">{{ formData.contact_name }}</div>
          <div class="text-gray-600">{{ formData.contact_email }}</div>
          <div class="text-gray-600">{{ formData.contact_phone }}</div>
        </div>
      </div>

      <!-- Agent(s) -->
      <div class="space-y-1">
        <MultiSelect
          v-model="formData.agents"
          :options="agentOptions"
          optionLabel="label"
          optionValue="id"
          display="chip"
          :filter="true"
          class="w-full custom-dropdown"
          :placeholder="$t('appointments.placeholders.agent')"
        />
      </div>

      <!-- Durum (Sadece edit modunda) -->
      <div v-if="isEdit" class="space-y-1">
        <Dropdown
          v-model="statusValue"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          :placeholder="$t('appointments.fields.status')"
          class="w-full custom-dropdown"
        />
      </div>

      <!-- Notlar -->
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <Button
          :label="$t('common.cancel')"
          icon="pi pi-times"
          @click="closeModal"
          class="cancel-button"
        />
        <Button
          :label="isEdit ? $t('common.update') : $t('common.save')"
          :icon="isEdit ? 'pi pi-pencil' : 'pi pi-check'"
          @click="saveAppointment"
          :loading="loading"
          :disabled="!isFormValid"
          class="save-button secondary"
        />
      </div>
    </template>
  </Dialog>
</template>

<script>
export default {
  name: "AppointmentModal",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    appointment: {
      type: Object,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    agents: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue", "save"],
  data() {
    return {
      formData: this.getEmptyForm(),
      errors: {},
      statusValue: "upcoming",
      selectedContact: null,
      contactSuggestions: [],
      searchingContacts: false,
      allContacts: [],
      contactsLoaded: false,
    };
  },
  computed: {
    isEdit() {
      return !!this.appointment;
    },
    isPastDate() {
      const d = new Date(this.formData.appointment_date);
      if (isNaN(d.getTime())) return false;
      return d < new Date();
    },
    statusOptions() {
      // Tarih geçmişse: Completed + Cancelled, değilse: Upcoming + Cancelled
      return this.isPastDate
        ? [
            {
              label: this.$t("appointments.status.completed"),
              value: "completed",
            },
            {
              label: this.$t("appointments.status.cancelled"),
              value: "cancelled",
            },
          ]
        : [
            {
              label: this.$t("appointments.status.upcoming"),
              value: "upcoming",
            },
            {
              label: this.$t("appointments.status.cancelled"),
              value: "cancelled",
            },
          ];
    },
    agentOptions() {
      return (this.agents || []).map((a) => {
        const id = a.id || a.code || a.key;
        const name = (a.agent_name || a.name || "").toString().trim();
        const surname = (a.agent_surname || a.surname || "").toString().trim();
        const label = `${name} ${surname}`.trim() || a.code || "Agent";
        return { id, label };
      });
    },
    isFormValid() {
      return (
        this.formData.appointment_date &&
        this.formData.appointment_address &&
        this.formData.contact_id
      );
    },
  },
  watch: {
    appointment: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.formData = {
            ...newVal,
            appointment_date: new Date(newVal.appointment_date),
          };
          // Eğer gelen appointment içinde agent data'sı varsa ID'leri normalize et
          if (newVal.agent_id || newVal.agent_name || newVal.agent_surname) {
            // NextTick ile agents prop'unun yüklendiğinden emin ol
            this.$nextTick(() => {
              // Appointment'tan agent data'sını extract et
              const appointmentAgentIds = Array.isArray(newVal.agent_id)
                ? newVal.agent_id
                : [];
              const appointmentAgentNames = Array.isArray(newVal.agent_name)
                ? newVal.agent_name
                : [];
              const appointmentAgentSurnames = Array.isArray(
                newVal.agent_surname
              )
                ? newVal.agent_surname
                : [];

              // Örneğe benzer şekilde: agents prop'undan eşleşenleri filtrele
              const matchedAgents = this.agents.filter((agent) => {
                // ID ile match
                const idMatch = appointmentAgentIds.some(
                  (id) =>
                    agent.id === id || agent.code === id || agent.key === id
                );

                // Name ile match
                const nameMatch = appointmentAgentNames.some((name) => {
                  const agentName = (
                    agent.agent_name ||
                    agent.name ||
                    ""
                  ).toLowerCase();
                  return (
                    agentName.includes(name.toLowerCase()) ||
                    name.toLowerCase().includes(agentName)
                  );
                });

                // Surname ile match
                const surnameMatch = appointmentAgentSurnames.some(
                  (surname) => {
                    const agentSurname = (
                      agent.agent_surname ||
                      agent.surname ||
                      ""
                    ).toLowerCase();
                    return (
                      agentSurname.includes(surname.toLowerCase()) ||
                      surname.toLowerCase().includes(agentSurname)
                    );
                  }
                );

                return idMatch || nameMatch || surnameMatch;
              });

              // Matched agent ID'larını set et (örneğe benzer)
              this.formData.agents = matchedAgents.map((agent) => agent.id);
            });
          }
          // is_cancelled bilgisine göre statusValue ata
          this.statusValue = newVal.is_cancelled
            ? "cancelled"
            : this.isPastDate
            ? "completed"
            : "upcoming";
        } else {
          this.formData = this.getEmptyForm();
          this.statusValue = "upcoming";
        }
        this.errors = {};
      },
    },
    modelValue(visible) {
      if (!visible) {
        this.errors = {};
      } else {
        // Modal açılırken contact'ları yükle
        this.loadAllContacts();
      }
    },
  },
  methods: {
    getEmptyForm() {
      return {
        appointment_date: new Date(),
        appointment_address: "",
        contact_id: null,
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        is_cancelled: false,
        agents: [],
      };
    },
    async loadAllContacts() {
      if (this.contactsLoaded) return;

      try {
        this.searchingContacts = true;
        const { ContactService } = await import(
          "../../api/services/contact.service"
        );
        const response = await ContactService.getAllContacts();

        this.allContacts = (response.data || []).map((contact) => ({
          id: contact.contact_id, // Contact ID field - bu API'nin beklediği ID
          airtableId: contact.id, // Airtable record ID (recXXXXXX format) backup olarak
          name: contact.contact_name,
          email: contact.contact_email,
          phone: contact.contact_phone,
          display: `${contact.contact_name} - ${
            contact.contact_email || contact.contact_phone || ""
          }`,
        }));
        this.contactsLoaded = true;
      } catch (error) {
        this.allContacts = [];
      } finally {
        this.searchingContacts = false;
      }
    },
    async searchContacts(event) {
      try {
        // Loading'i false'a set et önce
        this.searchingContacts = false;

        // Contacts yüklenmemişse yükle
        await this.loadAllContacts();

        if (!event.query || event.query.length < 1) {
          this.contactSuggestions = [];
          return;
        }

        // Frontend'de filtreleme yap
        const searchLower = event.query.toLowerCase();
        this.contactSuggestions = this.allContacts
          .filter(
            (contact) =>
              contact.name?.toLowerCase().includes(searchLower) ||
              contact.email?.toLowerCase().includes(searchLower) ||
              (contact.phone && contact.phone.toString().includes(event.query))
          )
          .slice(0, 20); // İlk 20 sonucu göster
      } catch (error) {
        console.error("Contact search error:", error);
        this.contactSuggestions = [];
      } finally {
        this.searchingContacts = false;
      }
    },
    onContactSelect(event) {
      const contact = event.value;
      if (contact) {
        this.formData.contact_id = contact.id;
        this.formData.contact_name = contact.name;
        this.formData.contact_email = contact.email || "";
        this.formData.contact_phone = contact.phone || "";
        this.selectedContact = contact.display;
      }
    },
    validateForm() {
      this.errors = {};

      if (!this.formData.appointment_date) {
        this.errors.appointment_date = this.$t("validation.required");
      }

      if (!this.formData.appointment_address) {
        this.errors.appointment_address = this.$t("validation.required");
      }

      if (!this.formData.contact_id) {
        this.errors.contact = this.$t("validation.contactRequired");
      }

      return Object.keys(this.errors).length === 0;
    },
    saveAppointment() {
      if (!this.validateForm()) {
        return;
      }

      // statusValue'ı is_cancelled ve olası completed bilgisine çevir
      const isCancelled = this.statusValue === "cancelled";
      const appointmentData = {
        ...this.formData,
        is_cancelled: isCancelled,
        status: this.statusValue,
        // appointment_date zaten service'de ISO'ya çevriliyor
        appointment_date: this.formData.appointment_date,
      };

      this.$emit("save", appointmentData);
    },
    closeModal() {
      this.$emit("update:modelValue", false);
      this.errors = {};
    },
  },
};
</script>

<style scoped>
/* Modal genel stilleri */
:deep(.appointment-modal .p-dialog-header) {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%
  );
  color: white;
  border-radius: 0.5rem 0.5rem 0 0;
}

:deep(.appointment-modal .p-dialog-header .p-dialog-title) {
  font-weight: 600;
  font-size: 1.25rem;
}

:deep(.appointment-modal .p-dialog-content) {
  padding: 0;
  border-radius: 0 0 0.5rem 0.5rem;
}

/* Form input stilleri */
.custom-input {
  border: 2px solid var(--color-primary);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.custom-input:focus {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(var(--color-secondary-rgb), 0.1);
  outline: none;
}

.custom-input.p-invalid {
  border-color: #ef4444;
}

/* Calendar stilleri */
:deep(.custom-calendar .p-calendar) {
  border: 2px solid var(--color-primary);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

:deep(.custom-calendar .p-calendar:focus-within) {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(var(--color-secondary-rgb), 0.1);
}

:deep(.custom-calendar .p-inputtext) {
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
}

:deep(.custom-calendar .p-inputtext:focus) {
  box-shadow: none;
  outline: none;
}

/* Dropdown stilleri */
:deep(.custom-dropdown .p-dropdown) {
  border: 2px solid var(--color-primary);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

:deep(.custom-dropdown .p-dropdown:focus-within) {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(var(--color-secondary-rgb), 0.1);
}

:deep(.custom-dropdown .p-dropdown-label) {
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
}

/* Textarea stilleri */
:deep(.custom-textarea .p-inputtextarea) {
  border: 2px solid var(--color-primary);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  resize: vertical;
}

:deep(.custom-textarea .p-inputtextarea:focus) {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(var(--color-secondary-rgb), 0.1);
  outline: none;
}

/* Hata mesajları */
.p-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Label stilleri */
label {
  color: #374151;
  margin-bottom: 0.5rem;
}

/* Responsive tasarım */
@media (max-width: 768px) {
  :deep(.appointment-modal .p-dialog) {
    width: 95vw !important;
    margin: 1rem;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

/* Button stilleri */
:deep(.p-button) {
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Cancel Button - Black Style */
::deep(.cancel-button) {
  background-color: #1f2937 !important;
  color: white !important;
  border: 2px solid #1f2937 !important;
}

::deep(.cancel-button:hover) {
  background-color: #111827 !important;
  border-color: #111827 !important;
  color: white !important;
}

::deep(.cancel-button:focus) {
  box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.2) !important;
}

/* Save/Update Button - Secondary Style */
::deep(.save-button.secondary) {
  background-color: var(--color-secondary) !important;
  color: white !important;
  border: 2px solid var(--color-secondary) !important;
}

::deep(.save-button.secondary:hover:not(:disabled)) {
  background-color: #ff3b8a !important;
  border-color: #ff3b8a !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

::deep(.save-button.secondary:disabled) {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
