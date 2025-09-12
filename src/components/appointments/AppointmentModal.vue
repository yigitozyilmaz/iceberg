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
              class="w-full custom-input modal-search-input pr-12 text-center"
              :class="{ 'p-invalid': errors.contact }"
              :loading="searchingContacts"
              forceSelection
            />
            <!-- Right black search icon area -->
            <div
              class="absolute right-0 top-0 h-full w-10 bg-black text-white flex items-center justify-center rounded-r-md pointer-events-none"
            >
              <i class="pi pi-search text-sm"></i>
            </div>
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
                  {{ toDisplayString(formData.contact_name) }}
                </div>
                <div class="text-sm text-gray-600 flex items-center gap-1">
                  <i class="pi pi-envelope text-xs"></i>
                  {{ toDisplayString(formData.contact_email) }}
                </div>
                <div class="text-sm text-gray-600 flex items-center gap-1">
                  <i class="pi pi-phone text-xs"></i>
                  {{ toDisplayString(formData.contact_phone) }}
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
          <div v-if="!isEdit" class="relative">
            <InputText
              v-model="formData.appointment_address"
              class="w-full custom-input pr-12"
              :class="{ 'p-invalid': errors.appointment_address }"
              :placeholder="$t('appointments.placeholders.address')"
            />
            <!-- Home icon -->
            <div
              class="absolute right-0 top-0 h-full w-10 flex items-center justify-center rounded-r-md pointer-events-none"
            >
              <i class="pi pi-home text-sm"></i>
            </div>
          </div>

          <!-- Edit Mode: Show card or input based on editing state -->
          <div v-else>
            <!-- Address Input (Address edit modunda göster) -->
            <div v-if="editingAddress" class="relative">
              <InputText
                v-model="formData.appointment_address"
                class="w-full custom-input pr-12"
                :class="{ 'p-invalid': errors.appointment_address }"
                :placeholder="$t('appointments.placeholders.address')"
              />
              <!-- Home icon -->
              <div
                class="absolute right-0 top-0 h-full w-10 bg-gray-100 text-gray-600 flex items-center justify-center rounded-r-md pointer-events-none"
              >
                <i class="pi pi-home text-sm"></i>
              </div>
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
            <div v-else class="relative">
              <InputText
                v-model="formData.appointment_address"
                class="w-full custom-input pr-12"
                :class="{ 'p-invalid': errors.appointment_address }"
                :placeholder="$t('appointments.placeholders.address')"
              />
              <!-- Home icon -->
              <div
                class="absolute right-0 top-0 h-full w-10 bg-gray-100 text-gray-600 flex items-center justify-center rounded-r-md pointer-events-none"
              >
                <i class="pi pi-home text-sm"></i>
              </div>
            </div>
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
            class="w-full custom-dropdown agent-multiselect custom-multiselect"
            :placeholder="$t('appointments.placeholders.agent')"
          />
        </div>

        <!-- 4. Date and Time -->
        <div class="space-y-1">
          <div class="relative">
            <Calendar
              v-model="formData.appointment_date"
              showTime
              dateFormat="dd/mm/yy"
              :showIcon="true"
              class="w-full custom-calendar"
              :placeholder="$t('appointments.placeholders.date')"
              :class="{ 'p-invalid': errors.appointment_date }"
            />
            <!-- Manual calendar icon as fallback -->
            <div
              class="absolute right-0 top-0 h-full w-12 text-gray-600 flex items-center justify-center rounded-r-md z-10 cursor-pointer hover:text-gray-800 transition-colors"
              @click="openCalendar"
            >
              <i class="pi pi-calendar text-lg"></i>
            </div>
          </div>
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
            :style="{
              border: '2px solid var(--color-primary)',
              borderRadius: '0.5rem',
            }"
          />
        </div>
      </div>

      <!-- Related Appointments (only in edit) -->
      <div class="px-4 pb-4" v-if="isEdit && hasSelectedContact">
        <div class="text-sm text-gray-700 font-semibold mb-2">
          Related Appointments:
        </div>

        <div
          v-if="loadingRelated"
          class="flex items-center gap-2 text-gray-500 text-sm"
        >
          <i class="pi pi-spin pi-spinner"></i>
          Loading...
        </div>

        <div v-else>
          <div
            v-for="ra in visibleRelatedAppointments"
            :key="ra.id"
            class="border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between gap-3 mb-2 bg-white"
          >
            <!-- Left: address + pill stacked -->
            <div class="flex items-start gap-2">
              <div class="flex flex-col">
                <div class="text-sm text-gray-900 font-medium">
                  <i class="pi pi-home text-gray-600 mt-0.5"></i>
                  {{ ra.appointment_address || "-" }}
                </div>
                <div class="mt-1">
                  <div
                    class="flex items-center gap-2 bg-pink-500 rounded-full px-2 py-1 w-fit"
                  >
                    <span
                      class="text-xs rounded-full bg-white text-green-600 px-2 py-0.5 font-semibold"
                      v-if="
                        !ra.is_cancelled &&
                        new Date(ra.appointment_date) <= new Date()
                      "
                    >
                      Completed
                    </span>
                    <span
                      class="text-xs rounded-full bg-white text-slate-700 px-2 py-0.5 font-semibold"
                      v-else-if="
                        !ra.is_cancelled &&
                        new Date(ra.appointment_date) > new Date()
                      "
                    >
                      Upcoming
                    </span>
                    <span
                      class="text-xs rounded-full bg-white text-red-600 px-2 py-0.5 font-semibold"
                      v-else
                    >
                      Cancelled
                    </span>
                    <span class="text-xs text-white flex items-center gap-1">
                      <i class="pi pi-clock text-xs"></i>
                      {{ formatDate(ra.appointment_date) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: agents -->
            <div class="flex items-center gap-2">
              <template
                v-for="(agent, index) in normalizeAgents(ra).slice(0, 2)"
                :key="index"
              >
                <div
                  class="rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white shadow-sm"
                  :style="agentStyle(agent)"
                  style="width: 2rem; height: 2rem"
                  :title="agentDisplayName(agent)"
                >
                  {{ agentInitialsFrom(agent) }}
                </div>
              </template>
              <div
                v-if="normalizeAgents(ra).length > 2"
                class="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center font-semibold cursor-default"
                @mouseenter="
                  openOverflowForAgents(normalizeAgents(ra).slice(2), $event)
                "
                @mouseleave="startClose"
              >
                +{{ normalizeAgents(ra).length - 2 }}
              </div>
            </div>
          </div>

          <div
            v-if="!relatedAppointmentsSorted.length"
            class="text-xs text-gray-500"
          >
            No related appointments found.
          </div>

          <div
            v-if="relatedAppointmentsSorted.length > 3"
            class="flex justify-center mt-2"
          >
            <button
              type="button"
              class="text-gray-600 text-sm flex items-center gap-1 hover:text-gray-800"
              @click="showAllRelated = !showAllRelated"
            >
              <i
                :class="[
                  'pi',
                  showAllRelated ? 'pi-chevron-up' : 'pi-chevron-down',
                ]"
              ></i>
              <span>{{ showAllRelated ? "Show less" : "Show more" }}</span>
            </button>
          </div>
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
    agentColorByCode: {
      type: Object,
      default: () => ({}),
    },
    agentColorByName: {
      type: Object,
      default: () => ({}),
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
      relatedAppointments: [],
      loadingRelated: false,
      showAllRelated: false,
      tooltipEl: null,
      _closeTimer: null,
    };
  },
  computed: {
    isEdit() {
      return !!this.appointment;
    },
    hasSelectedContact() {
      const cid = this.formData?.contact_id;
      if (Array.isArray(cid)) return cid.length > 0;
      return !!cid;
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
    relatedAppointmentsSorted() {
      const now = new Date();
      const valid = this.relatedAppointments.filter(
        (a) => !isNaN(new Date(a.appointment_date).getTime())
      );
      const invalid = this.relatedAppointments.filter((a) =>
        isNaN(new Date(a.appointment_date).getTime())
      );
      const future = valid
        .filter((a) => new Date(a.appointment_date) >= now)
        .sort(
          (a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)
        );
      const past = valid
        .filter((a) => new Date(a.appointment_date) < now)
        .sort(
          (a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)
        );
      return [...future, ...past, ...invalid];
    },
    visibleRelatedAppointments() {
      if (this.showAllRelated) return this.relatedAppointmentsSorted;
      return this.relatedAppointmentsSorted.slice(0, 3);
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
          // Load related appointments for selected contact when editing
          if (this.isEdit && this.formData.contact_id) {
            this.loadRelatedAppointments();
          }
        } else {
          this.formData = this.getEmptyForm();
          this.statusValue = "upcoming";
          this.relatedAppointments = [];
        }
        this.errors = {};
      },
    },
    modelValue(visible) {
      if (!visible) {
        // Modal kapandığında tüm state'i temizle (programmatic close dahil)
        this.clearAllStates();
      } else {
        // Modal açılırken contact'ları yükle
        this.loadAllContacts();
        if (this.isEdit && this.formData.contact_id)
          this.loadRelatedAppointments();
      }
    },
    "formData.contact_id"(val) {
      if (this.isEdit && val) {
        this.loadRelatedAppointments();
      } else {
        this.relatedAppointments = [];
      }
    },
  },
  methods: {
    normalizeAgents(appointment) {
      // Same normalization as list
      if (Array.isArray(appointment?.agents) && appointment.agents.length) {
        return appointment.agents.map((a) => ({
          name: a.name || null,
          surname: a.surname || null,
          code: a.code || null,
          color: a.color || null,
        }));
      }
      const names = Array.isArray(appointment?.agent_name)
        ? appointment.agent_name
        : appointment?.agent_name
        ? [appointment.agent_name]
        : [];
      const surnames = Array.isArray(appointment?.agent_surname)
        ? appointment.agent_surname
        : appointment?.agent_surname
        ? [appointment.agent_surname]
        : [];
      const len = Math.max(names.length, surnames.length);
      const list = [];
      for (let i = 0; i < len; i++) {
        list.push({
          name: names[i] || null,
          surname: surnames[i] || null,
          code: null,
          color: null,
        });
      }
      return list;
    },
    agentInitialsFrom(agent) {
      const f = (agent?.name || "").toString().trim();
      const l = (agent?.surname || "").toString().trim();
      if (f || l) return `${f ? f[0] : ""}${l ? l[0] : ""}`.toUpperCase();
      const code = (agent?.code || "").toString().trim();
      return code ? code.slice(0, 2).toUpperCase() : "??";
    },
    agentDisplayName(agent) {
      const f = (agent?.name || "").toString().trim();
      const l = (agent?.surname || "").toString().trim();
      const code = (agent?.code || "").toString().trim();
      return f || l ? `${f} ${l}`.trim() : code || "Agent";
    },
    agentClass(agent) {
      return "";
    },
    agentStyle(agent) {
      const code = (agent?.code || "").toString().trim().toUpperCase();
      const fullName = `${(agent?.name || "").toString().trim()} ${(
        agent?.surname || ""
      )
        .toString()
        .trim()}`
        .trim()
        .toLowerCase();
      const token =
        (code && this.agentColorByCode[code]) ||
        (fullName && this.agentColorByName[fullName]) ||
        agent?.color ||
        null;
      const hex = this.colorTokenToHex(token) || "#e5e7eb";
      return { backgroundColor: hex, color: this.contrastText(hex) };
    },
    colorTokenToHex(token) {
      if (!token) return null;
      if (typeof token === "string" && token.startsWith("#")) return token;
      const map = {
        yellow: "#fde047",
        orange: "#fb923c",
        purple: "#c084fc",
        green: "#86efac",
        blue: "#93c5fd",
        pink: "#f9a8d4",
        gray: "#e5e7eb",
      };
      return map[token] || null;
    },
    contrastText(hex) {
      try {
        const clean = hex.replace("#", "");
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 140 ? "#111827" : "#ffffff";
      } catch (e) {
        return "#111827";
      }
    },
    openOverflowForAgents(agents, evt) {
      if (this.tooltipEl) return;
      const rect = evt.currentTarget.getBoundingClientRect();
      const el = document.createElement("div");
      el.className =
        "fixed bg-white border border-gray-200 rounded-md shadow-lg p-2 text-xs text-gray-700 whitespace-nowrap z-[9999]";
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.bottom + 8}px`;
      el.style.transform = "translateX(-50%)";
      el.style.minWidth = "140px";

      for (const agent of agents) {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2 px-2 py-0.5 leading-5";
        const avatar = document.createElement("div");
        avatar.className =
          "rounded-full flex items-center justify-center text-xs font-semibold border border-white shadow-sm";
        avatar.style.width = "1.5rem";
        avatar.style.height = "1.5rem";
        const initials = this.agentInitialsFrom(agent);
        const { className, style } = this._agentClassAndStyle(agent);
        if (className) avatar.className += ` ${className}`;
        if (style && style.backgroundColor) {
          avatar.style.backgroundColor = style.backgroundColor;
          avatar.style.color = style.color;
        }
        avatar.textContent = initials;
        row.appendChild(avatar);
        const label = document.createElement("span");
        label.textContent = this.agentDisplayName(agent);
        row.appendChild(label);
        el.appendChild(row);
      }

      el.addEventListener("mouseenter", () => {
        if (this._closeTimer) {
          clearTimeout(this._closeTimer);
          this._closeTimer = null;
        }
      });
      el.addEventListener("mouseleave", () => this.startClose());

      document.body.appendChild(el);
      this.tooltipEl = el;
    },
    _agentClassAndStyle(agent) {
      const code = (agent?.code || "").toString().trim().toUpperCase();
      const fullName = `${(agent?.name || "").toString().trim()} ${(
        agent?.surname || ""
      )
        .toString()
        .trim()}`
        .trim()
        .toLowerCase();
      const colorToken =
        (code && this.agentColorByCode[code]) ||
        (fullName && this.agentColorByName[fullName]) ||
        agent?.color ||
        null;
      if (typeof colorToken === "string" && colorToken.startsWith("#")) {
        return {
          className: "",
          style: {
            backgroundColor: colorToken,
            color: this.contrastText(colorToken),
          },
        };
      }
      const classNameMap = {
        yellow: "bg-yellow-300 text-yellow-900",
        orange: "bg-orange-300 text-orange-900",
        purple: "bg-purple-300 text-purple-900",
        green: "bg-green-300 text-green-900",
        blue: "bg-blue-300 text-blue-900",
        pink: "bg-pink-300 text-pink-900",
        gray: "bg-gray-300 text-gray-700",
      };
      return {
        className: classNameMap[colorToken] || classNameMap.gray,
        style: null,
      };
    },
    startClose() {
      if (this._closeTimer) clearTimeout(this._closeTimer);
      this._closeTimer = setTimeout(() => {
        if (this.tooltipEl) {
          document.body.removeChild(this.tooltipEl);
          this.tooltipEl = null;
        }
      }, 80);
    },
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
    toDisplayString(value) {
      if (Array.isArray(value)) {
        return value.filter(Boolean).join(", ");
      }
      return value || "";
    },
    formatDate(date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    },
    normalizeAgentKey(agent) {
      const code = (agent?.code || "").toString().trim().toUpperCase();
      if (code) return code;
      const f = (agent?.name || "").toString().trim();
      const l = (agent?.surname || "").toString().trim();
      const initials = `${f ? f[0] : ""}${l ? l[0] : ""}`.toUpperCase();
      return initials || null;
    },
    appointmentAgentKeys(appointment) {
      const keys = [];
      if (Array.isArray(appointment?.agents)) {
        for (const a of appointment.agents) {
          const k = this.normalizeAgentKey(a);
          if (k) keys.push(k);
        }
      }
      const names = Array.isArray(appointment?.agent_name)
        ? appointment.agent_name
        : appointment?.agent_name
        ? [appointment.agent_name]
        : [];
      const surnames = Array.isArray(appointment?.agent_surname)
        ? appointment.agent_surname
        : appointment?.agent_surname
        ? [appointment.agent_surname]
        : [];
      const len = Math.max(names.length, surnames.length);
      for (let i = 0; i < len; i++) {
        const obj = { name: names[i] || null, surname: surnames[i] || null };
        const k = this.normalizeAgentKey(obj);
        if (k) keys.push(k);
      }
      return keys;
    },
    firstAgentInitials(appointment) {
      const keys = this.appointmentAgentKeys(appointment);
      return keys[0] || "—";
    },
    agentInitials(appointment) {
      return this.appointmentAgentKeys(appointment);
    },
    agentNames(appointment) {
      const names = Array.isArray(appointment?.agent_name)
        ? appointment.agent_name
        : appointment?.agent_name
        ? [appointment.agent_name]
        : [];
      const surnames = Array.isArray(appointment?.agent_surname)
        ? appointment.agent_surname
        : appointment?.agent_surname
        ? [appointment.agent_surname]
        : [];
      const result = [];
      const len = Math.max(names.length, surnames.length);
      for (let i = 0; i < len; i++) {
        const name = (names[i] || "").toString().trim();
        const surname = (surnames[i] || "").toString().trim();
        const full = `${name} ${surname}`.trim();
        if (full) result.push(full);
      }
      return result;
    },
    async loadRelatedAppointments() {
      try {
        this.loadingRelated = true;
        const { AppointmentService } = await import(
          "../../api/services/appointment.service"
        );
        const response = await AppointmentService.getAllAppointments();
        const all = response.data || [];
        const selectedContactIds = Array.isArray(this.formData.contact_id)
          ? this.formData.contact_id
          : this.formData.contact_id
          ? [this.formData.contact_id]
          : [];
        const currentId = this.appointment?.id || null;

        // contact_id alanı Airtable linked record olduğu için array olabilir
        this.relatedAppointments = all.filter((a) => {
          if (currentId && a.id === currentId) return false; // şu anki kaydı dahil etme
          const cid = Array.isArray(a.contact_id)
            ? a.contact_id
            : a.contact_id
            ? [a.contact_id]
            : [];
          return selectedContactIds.some((id) => cid.includes(id));
        });
      } catch (e) {
        this.relatedAppointments = [];
      } finally {
        this.loadingRelated = false;
      }
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
        this.loadRelatedAppointments();
      }
    },
    clearContact() {
      this.formData.contact_id = null;
      this.formData.contact_name = "";
      this.formData.contact_email = "";
      this.formData.contact_phone = "";
      this.selectedContact = null;
      this.relatedAppointments = [];
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
    openCalendar() {
      // Calendar'ı programmatically açmak için input'a focus ver
      this.$nextTick(() => {
        const calendarInput = document.querySelector(
          ".custom-calendar .p-inputtext"
        );
        if (calendarInput) {
          calendarInput.focus();
          calendarInput.click();
        }
      });
    },
  },
};
</script>

<style scoped>
/* Modal genel stilleri */
:deep(.appointment-modal .p-dialog-header) {
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Modal header content ortala */
:deep(.appointment-modal .p-dialog-header-content) {
  width: 100%;
  text-align: center;
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
  background: var(--color-primary);
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

/* Calendar stilleri - Updated for better icon visibility */
:deep(.custom-calendar .p-calendar) {
  border: 2px solid var(--color-primary);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

:deep(.custom-calendar .p-calendar:focus-within) {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(var(--color-secondary-rgb), 0.1);
}

:deep(.custom-calendar .p-inputtext) {
  border: none;
  padding: 0.5rem 0.75rem 0.5rem 0.75rem;
  padding-right: 4rem; /* Space for manual icon */
  font-size: 0.95rem;
  flex: 1;
  background: transparent;
}

:deep(.custom-calendar .p-inputtext:focus) {
  box-shadow: none;
  outline: none;
}

/* Force calendar icon to be visible */
:deep(.custom-calendar .p-datepicker-trigger) {
  display: none; /* Hide the original trigger */
}

/* Manual calendar icon styling - No background */
.custom-calendar .absolute {
  width: 3rem;
  min-height: 2.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-calendar .absolute i {
  font-size: 1.1rem;
  font-weight: 600;
  display: block;
}

/* Modal search align */
::deep(.modal-search-input.p-inputtext) {
  text-align: center;
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
    width: 95vw;
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
  background-color: #1f2937;
  color: white;
  border: 2px solid #1f2937;
}

::deep(.cancel-button:hover) {
  background-color: #111827;
  border-color: #111827;
  color: white;
}

::deep(.cancel-button:focus) {
  box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.2);
}

/* AutoComplete Focus Styling */
:deep(.p-autocomplete) {
  border: 1px solid var(--color-primary);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

:deep(.p-autocomplete:focus-within) {
  border: 2px solid var(--color-secondary);
}

:deep(.p-autocomplete .p-inputtext) {
  border: none;
  outline: none;
  box-shadow: none;
}

:deep(.p-autocomplete .p-inputtext:focus) {
  border: none;
  outline: none;
  box-shadow: none;
}

/* MultiSelect Focus Styling */
:deep(.p-multiselect) {
  border: 2px solid var(--color-primary);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

:deep(.p-multiselect:focus-within) {
  border: 2px solid var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

:deep(.p-multiselect .p-inputtext) {
  border: none;
  outline: none;
  box-shadow: none;
}

:deep(.p-multiselect .p-inputtext:focus) {
  border: none;
  outline: none;
  box-shadow: none;
}

/* MultiSelect Chip Styling */
:deep(.p-multiselect .p-multiselect-token) {
  background-color: var(--color-secondary);
  color: white;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  margin: 0.125rem;
  font-size: 0.875rem;
  font-weight: 500;
}

:deep(.p-multiselect .p-multiselect-token .p-multiselect-token-icon) {
  color: white;
  font-size: 0.75rem;
}

:deep(.p-multiselect .p-multiselect-token:hover .p-multiselect-token-icon) {
  color: #fecaca;
}

/* Cancel Button - Black Style */
:deep(.cancel-button) {
  background-color: #000000;
  color: white;
  border: 2px solid #000000;
}

:deep(.cancel-button:hover) {
  background-color: #333333;
  border-color: #333333;
  color: white;
}

:deep(.cancel-button:focus) {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2);
}

/* Save/Update Button - Secondary Style */
:deep(.save-button.secondary) {
  background-color: var(--color-secondary);
  color: white;
  border: 2px solid var(--color-secondary);
}

:deep(.save-button.secondary:hover:not(:disabled)) {
  background-color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

:deep(.save-button.secondary:disabled) {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  border: none;
  transform: none;
  box-shadow: none;
}
</style>
