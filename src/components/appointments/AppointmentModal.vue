<template>
  <Dialog
    :visible="modelValue"
    @update:visible="onModalVisibilityChange"
    :modal="true"
    :style="{ width: '32rem', maxWidth: '95vw' }"
    class="appointment-modal"
  >
    <template #header>
      <div class="flex items-center justify-center gap-2 w-full h-full">
        <i class="pi pi-calendar-plus text-xl"></i>
        <span class="text-lg font-semibold">
          {{ isEdit ? "Edit the Appointment" : "Create an Appointment" }}
        </span>
      </div>
    </template>
    <div class="modal-content-wrapper">
      <div class="modal-form-content">
        <!-- 1. Contact Search - En başta -->
        <div class="space-y-1">
          <!-- Search Input (Contact seçilmediğinde göster) -->
          <div v-if="!formData.contact_id" class="relative">
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
          </div>

          <!-- Selected Contact Card (Contact seçildiğinde göster) -->
          <div
            v-else
            class="bg-gray-50 p-3 rounded-md border border-gray-200 relative"
          >
            <button
              @click="clearContact"
              class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
            <div class="flex items-center gap-3">
              <i class="pi pi-user text-gray-600"></i>
              <div class="flex-1">
                <div class="font-medium text-gray-900">
                  {{ formData.contact_name }}
                </div>
                <div class="text-sm text-gray-600 flex items-center gap-1">
                  <i class="pi pi-envelope text-xs"></i>
                  {{ formData.contact_email }}
                </div>
                <div class="text-sm text-gray-600 flex items-center gap-1">
                  <i class="pi pi-phone text-xs"></i>
                  {{ formData.contact_phone }}
                </div>
              </div>
            </div>
          </div>
          <small v-if="errors.contact" class="p-error">{{
            errors.contact
          }}</small>
        </div>

        <!-- 2. Address -->
        <div class="space-y-1">
          <!-- Create Mode: Always show input -->
          <InputText
            v-if="!isEdit"
            v-model="formData.appointment_address"
            class="w-full custom-input"
            :class="{ 'p-invalid': errors.appointment_address }"
            :placeholder="$t('appointments.placeholders.address')"
          />

          <!-- Edit Mode: Show card or input based on editing state -->
          <div v-else>
            <!-- Address Input (Address edit modunda göster) -->
            <div v-if="editingAddress" class="relative">
              <InputText
                v-model="formData.appointment_address"
                class="w-full custom-input"
                :class="{ 'p-invalid': errors.appointment_address }"
                :placeholder="$t('appointments.placeholders.address')"
              />
            </div>

            <!-- Address Card (Address var ve edit modunda değilse göster) -->
            <div
              v-else-if="formData.appointment_address"
              class="bg-gray-50 p-3 rounded-md border border-gray-200 relative"
            >
              <button
                @click="startEditingAddress"
                class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
              <div class="flex items-center gap-3">
                <i class="pi pi-home text-gray-600"></i>
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ formData.appointment_address }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Address Input (Address yoksa göster) -->
            <InputText
              v-else
              v-model="formData.appointment_address"
              class="w-full custom-input"
              :class="{ 'p-invalid': errors.appointment_address }"
              :placeholder="$t('appointments.placeholders.address')"
            />
          </div>

          <small v-if="errors.appointment_address" class="p-error">{{
            errors.appointment_address
          }}</small>
        </div>

        <!-- 3. Agents MultiSelect -->
        <div class="space-y-1">
          <MultiSelect
            v-model="formData.agents"
            :options="agentOptions"
            optionLabel="label"
            optionValue="id"
            display="chip"
            :filter="true"
            class="w-full custom-dropdown agent-multiselect"
            :placeholder="$t('appointments.placeholders.agent')"
          />
        </div>

        <!-- 4. Date and Time -->
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

        <!-- 5. Status (Sadece edit modunda) -->
        <div v-if="isEdit" class="space-y-1">
          <Dropdown
            v-model="statusValue"
            :options="dynamicStatusOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="$t('appointments.fields.status')"
            class="w-full custom-dropdown"
          />
        </div>
      </div>

      <!-- Butonlar - Modal'ın en altında -->
      <div class="modal-buttons">
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
    </div>
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
      editingAddress: false,
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
    dynamicStatusOptions() {
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
        this.formData.contact_id = contact.airtableId; // Airtable record ID (recXXX format)
        this.formData.contact_name = contact.name;
        this.formData.contact_email = contact.email || "";
        this.formData.contact_phone = contact.phone || "";
        this.selectedContact = contact.display;
      }
    },
    clearContact() {
      this.formData.contact_id = null;
      this.formData.contact_name = "";
      this.formData.contact_email = "";
      this.formData.contact_phone = "";
      this.selectedContact = null;
    },
    startEditingAddress() {
      this.editingAddress = true;
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
    onModalVisibilityChange(isVisible) {
      // Modal kapanıyorsa state'leri temizle
      if (!isVisible) {
        this.clearAllStates();
      }
      // Parent'a modal durumunu bildir
      this.$emit("update:modelValue", isVisible);
    },
    closeModal() {
      // Tüm state'leri temizle
      this.clearAllStates();
      // Parent'a modal kapandığını bildir
      this.$emit("update:modelValue", false);
    },
    clearAllStates() {
      // Tüm state'leri temizle
      this.formData = this.getEmptyForm();
      this.errors = {};
      this.selectedContact = null;
      this.contactSuggestions = [];
      this.statusValue = "upcoming";
      this.editingAddress = false;

      // Contact search state'ini de temizle
      this.allContacts = [];
      this.contactsLoaded = false;
      this.searchingContacts = false;
    },
  },
};
</script>

<style scoped>
/* Modal genel stilleri */
:deep(.appointment-modal .p-dialog-header) {
  color: white;

  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* Modal header content ortala */
:deep(.appointment-modal .p-dialog-header-content) {
  width: 100% !important;
  text-align: center !important;
}

/* Modal content wrapper - flex layout */
.modal-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 60vh;
}

.modal-form-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* AutoComplete Focus Styling */
:deep(.p-autocomplete) {
  border: 1px solid var(--color-primary);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

:deep(.p-autocomplete:focus-within) {
  border: 2px solid var(--color-secondary) !important;
}

:deep(.p-autocomplete .p-inputtext) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

:deep(.p-autocomplete .p-inputtext:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* MultiSelect Focus Styling */
:deep(.p-multiselect) {
  border: 1px solid var(--color-primary);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

:deep(.p-multiselect:focus-within) {
  border: 2px solid var(--color-secondary) !important;
  box-shadow: none !important;
}

:deep(.p-multiselect .p-inputtext) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

:deep(.p-multiselect .p-inputtext:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* MultiSelect Chip Styling */
:deep(.p-multiselect .p-multiselect-token) {
  background-color: var(--color-secondary) !important;
  color: white !important;
  border-radius: 0.375rem !important;
  padding: 0.25rem 0.5rem !important;
  margin: 0.125rem !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
}

:deep(.p-multiselect .p-multiselect-token .p-multiselect-token-icon) {
  color: white !important;
  font-size: 0.75rem !important;
}

:deep(.p-multiselect .p-multiselect-token:hover .p-multiselect-token-icon) {
  color: #fecaca !important;
}

/* Cancel Button - Black Style */
:deep(.cancel-button) {
  background-color: #000000 !important;
  color: white !important;
  border: 2px solid #000000 !important;
}

:deep(.cancel-button:hover) {
  background-color: #333333 !important;
  border-color: #333333 !important;
  color: white !important;
}

:deep(.cancel-button:focus) {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2) !important;
}

/* Save/Update Button - Secondary Style */
:deep(.save-button.secondary) {
  background-color: var(--color-secondary) !important;
  color: white !important;
  border: 2px solid var(--color-secondary) !important;
}

:deep(.save-button.secondary:hover:not(:disabled)) {
  background-color: var(--color-secondary) !important;

  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

:deep(.save-button.secondary:disabled) {
  background: #d1d5db !important;
  color: #9ca3af !important;
  cursor: not-allowed;
  border: none !important;
  transform: none;
  box-shadow: none;
}
</style>
