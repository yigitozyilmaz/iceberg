<template>
  <div
    class="py-3 flex items-center justify-evenly w-full overflow-hidden px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 cursor-pointer hover:bg-gray-50 transition-colors"
    @click="handleRowClick"
  >
    <!-- 1) Name / Email / Phone -->
    <div class="flex flex-col gap-1 min-w-[220px] basis-1/4 min-w-0">
      <div class="flex items-center gap-2">
        <i class="pi pi-user text-gray-400 text-sm" />
        <span class="font-medium text-gray-900 truncate">{{
          visibleContactNames
        }}</span>
        <span
          v-if="contactExtraCount > 0"
          class="rounded-full bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 font-semibold cursor-default whitespace-nowrap"
          @mouseenter="openContactsOverflow"
          @mouseleave="startCloseContacts"
          ref="contactsOverflowAnchor"
        >
          +{{ contactExtraCount }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <i class="pi pi-envelope text-gray-400 text-xs" />
        <span class="truncate">{{ visibleContactEmails }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <i class="pi pi-phone text-gray-400 text-xs" />
        <span class="truncate">{{ visibleContactPhones }}</span>
      </div>
    </div>

    <!-- 2) Address -->
    <div
      class="flex items-start gap-2 font-medium text-gray-900 min-w-[220px] basis-1/4 min-w-0"
    >
      <i class="pi pi-home text-gray-400 text-xs mt-1 flex-shrink-0" />
      <span
        class="line-clamp-2 overflow-hidden text-sm leading-tight hover:text-gray-700 transition-colors"
        :title="formatArrayLike(appointment?.appointment_address)"
        >{{ formatArrayLike(appointment?.appointment_address) }}</span
      >
    </div>

    <!-- 3) Status pill (pink) -->
    <div class="flex items-center justify-start basis-1/4 min-w-0">
      <div
        :class="[
          'h-10 rounded-full flex items-center gap-3 pl-2 pr-4',
          statusPillClass,
        ]"
      >
        <div
          :class="[
            'rounded-full px-3 py-1 text-xs font-medium flex items-center whitespace-nowrap justify-center shrink-0 w-[140px]',
            statusBadgeClass,
          ]"
        >
          <span>{{ statusText }}</span>
          <span
            v-if="isUpcoming && timeUntilLabel"
            class="font-semibold ml-4 text-black"
            >{{ timeUntilLabel }}</span
          >
        </div>
        <div
          class="flex items-center gap-2 text-white text-xs whitespace-nowrap w-[160px] justify-center"
        >
          <i class="pi pi-clock" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>
    </div>

    <!-- 4) Agents -->
    <div class="flex items-center justify-center basis-1/4 min-w-0">
      <div v-if="computedAgents.length" class="flex -space-x-2">
        <div
          v-for="(agent, index) in limitedAgents"
          :key="index"
          class="rounded-full flex items-center justify-center text-sm font-semibold border-2 border-white shadow-sm"
          :style="agentHexStyle(agent)"
          style="width: 2.5rem; height: 2.5rem"
          :title="getAgentDisplayName(agent)"
        >
          {{ getAgentInitials(agent) }}
        </div>
        <div
          v-if="extraCount > 0"
          class="relative"
          @mouseenter="openOverflow"
          @mouseleave="startClose"
          ref="overflowAnchor"
        >
          <div
            class="rounded-full flex items-center justify-center text-sm font-semibold border-2 border-white bg-gray-200 text-gray-700 shadow-sm"
            style="width: 2.5rem; height: 2.5rem"
          >
            +{{ extraCount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAgentsStore } from "../../store/agents";
export default {
  name: "AppointmentRow",
  props: {
    appointment: {
      type: Object,
      required: true,
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
  data() {
    return {
      // floating tooltip element and close timer
      tooltipEl: null,
      _closeTimer: null,
    };
  },
  computed: {
    agentsStore() {
      return useAgentsStore();
    },
    // Contacts display helpers
    contactNames() {
      const value = this.appointment?.contact_name;
      if (Array.isArray(value)) {
        return value
          .filter(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
          .map((v) => String(v));
      }
      const s = String(value || "").trim();
      return s ? [s] : [];
    },
    contactEmails() {
      const value = this.appointment?.contact_email;
      if (Array.isArray(value)) {
        return value
          .filter(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
          .map((v) => String(v));
      }
      const s = String(value || "").trim();
      return s ? [s] : [];
    },
    contactPhones() {
      const value = this.appointment?.contact_phone;
      if (Array.isArray(value)) {
        return value
          .filter(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
          .map((v) => String(v));
      }
      const s = String(value || "").trim();
      return s ? [s] : [];
    },
    visibleContactNames() {
      const list = this.contactNames.slice(0, 3);
      return list.length
        ? list.join(", ")
        : this.formatArrayLike(this.appointment?.contact_name);
    },
    visibleContactEmails() {
      const list = this.contactEmails.slice(0, 3);
      return list.length
        ? list.join(", ")
        : this.formatArrayLike(this.appointment?.contact_email);
    },
    visibleContactPhones() {
      const list = this.contactPhones.slice(0, 3);
      return list.length
        ? list.join(", ")
        : this.formatArrayLike(this.appointment?.contact_phone);
    },
    contactExtraCount() {
      const extra = this.contactNames.length - 3;
      return extra > 0 ? extra : 0;
    },
    isUpcoming() {
      if (this.appointment?.is_cancelled) return false;
      const date = new Date(this.appointment?.appointment_date);
      if (isNaN(date.getTime())) return false;
      return date > new Date();
    },
    statusText() {
      if (this.appointment?.is_cancelled)
        return this.$t("appointments.status.cancelled");
      return this.isUpcoming
        ? this.$t("appointments.status.upcoming")
        : this.$t("appointments.status.completed");
    },
    statusBadgeClass() {
      if (this.appointment?.is_cancelled) return "bg-white text-[#FF4444]";
      const date = new Date(this.appointment?.appointment_date);
      if (isNaN(date.getTime())) return "bg-white text-[#2196F3]";
      const now = new Date();
      if (date > now) {
        const hours = Math.floor((date - now) / (1000 * 60 * 60));
        if (hours <= 2) return "bg-white text-[#FF9900]";
        return "bg-white text-[#2196F3]";
      }
      return "bg-white text-[#4CAF50]";
    },
    statusPillClass() {
      return "bg-secondary";
    },
    timeUntilLabel() {
      if (this.appointment?.is_cancelled) return null;
      const date = new Date(this.appointment?.appointment_date);
      if (isNaN(date.getTime())) return null;
      const now = new Date();
      const diff = date - now;
      if (diff <= 0) return null;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) return `${days} gün`;
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      if (hours > 0) return `${hours} saat`;
      return "< 1 saat";
    },
    formattedDate() {
      const date = new Date(this.appointment?.appointment_date);
      if (isNaN(date.getTime())) return "unknown";
      return date.toLocaleString(
        this.$i18n.locale === "tr" ? "tr-TR" : "en-US",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    },
    computedAgents() {
      if (
        Array.isArray(this.appointment?.agents) &&
        this.appointment.agents.length
      ) {
        return this.appointment.agents.map((a) => ({
          name: a.name || null,
          surname: a.surname || null,
          code: a.code || null,
          color: a.color || null,
        }));
      }
      const names = Array.isArray(this.appointment?.agent_name)
        ? this.appointment.agent_name
        : this.appointment?.agent_name
        ? [this.appointment.agent_name]
        : [];
      const surnames = Array.isArray(this.appointment?.agent_surname)
        ? this.appointment.agent_surname
        : this.appointment?.agent_surname
        ? [this.appointment.agent_surname]
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
    limitedAgents() {
      return this.computedAgents.slice(0, 4);
    },
    overflowAgents() {
      return this.computedAgents.slice(4);
    },
    extraCount() {
      const extra = this.computedAgents.length - 4;
      return extra > 0 ? extra : 0;
    },
  },
  methods: {
    handleRowClick() {
      this.$emit("edit", this.appointment);
    },
    openContactsOverflow() {
      if (this.tooltipEl) return;
      const anchor = this.$refs.contactsOverflowAnchor;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const el = document.createElement("div");
      el.className =
        "fixed bg-white border border-gray-200 rounded-md shadow-lg p-2 text-xs text-gray-700 whitespace-nowrap z-[9999]";
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.bottom + 8}px`;
      el.style.transform = "translateX(-50%)";
      el.style.minWidth = "200px";

      const title = document.createElement("div");
      title.className = "px-2 py-1 text-[11px] text-gray-500";
      try {
        title.textContent =
          this.$t("appointments.labels.otherContacts") || "Other contacts";
      } catch (e) {
        title.textContent = "Other contacts";
      }
      el.appendChild(title);

      const names = this.contactNames.slice(3);
      const emails = this.contactEmails.slice(3);
      const phones = this.contactPhones.slice(3);
      const len = Math.max(names.length, emails.length, phones.length);
      for (let i = 0; i < len; i++) {
        const row = document.createElement("div");
        row.className = "px-2 py-1 flex flex-col gap-0.5";

        const name = document.createElement("div");
        name.className = "text-gray-800 font-medium";
        name.textContent = names[i] || "";
        if (name.textContent) row.appendChild(name);

        const email = document.createElement("div");
        email.className = "text-gray-600";
        if (emails[i]) {
          email.textContent = emails[i];
          row.appendChild(email);
        }

        const phone = document.createElement("div");
        phone.className = "text-gray-600";
        if (phones[i]) {
          phone.textContent = phones[i];
          row.appendChild(phone);
        }

        if (row.children.length) el.appendChild(row);
      }

      el.addEventListener("mouseenter", () => {
        if (this._closeTimer) {
          clearTimeout(this._closeTimer);
          this._closeTimer = null;
        }
      });
      el.addEventListener("mouseleave", () => this.startCloseContacts());

      document.body.appendChild(el);
      this.tooltipEl = el;
    },
    startCloseContacts() {
      if (this._closeTimer) clearTimeout(this._closeTimer);
      this._closeTimer = setTimeout(() => {
        if (this.tooltipEl) {
          document.body.removeChild(this.tooltipEl);
          this.tooltipEl = null;
        }
      }, 80);
    },
    formatArrayLike(value) {
      if (value === null || value === undefined) return "unknown";
      if (Array.isArray(value)) {
        const normalized = value
          .filter(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
          .map((v) => String(v));
        return normalized.length ? normalized.join(", ") : "unknown";
      }
      const str = String(value);
      return str && str.trim() !== "" ? str : "unknown";
    },
    agentHexStyle(agent) {
      return this.agentsStore.bgStyleFor(agent);
    },
    contrastText(hex) {
      try {
        const clean = hex.replace("#", "");
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 140 ? "#111827" /* gray-900 */ : "#ffffff";
      } catch (e) {
        return "#111827";
      }
    },
    // randomColor removed: renkler API'den mapleniyor
    openOverflow() {
      // create floating tooltip appended to body to avoid clipping/stacking issues
      if (this.tooltipEl) return;
      const anchor = this.$refs.overflowAnchor;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const el = document.createElement("div");
      el.className =
        "fixed bg-white border border-gray-200 rounded-md shadow-lg p-2 text-xs text-gray-700 whitespace-nowrap z-[9999]";
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.bottom + 8}px`;
      el.style.transform = "translateX(-50%)";
      el.style.minWidth = "140px";

      const title = document.createElement("div");
      title.className = "px-2 py-1 text-[11px] text-gray-500";
      // Use i18n if available
      try {
        title.textContent = this.$t("appointments.labels.otherAgents");
      } catch (e) {
        title.textContent = "Other agents";
      }
      el.appendChild(title);

      for (const agent of this.overflowAgents) {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2 px-2 py-0.5 leading-5";
        // avatar with initials
        const avatar = document.createElement("div");
        avatar.className =
          "rounded-full flex items-center justify-center text-xs font-semibold border border-white shadow-sm";
        avatar.style.width = "1.5rem";
        avatar.style.height = "1.5rem";
        const code = (agent?.code || "").toString().trim().toUpperCase();
        const fullName = `${(agent?.name || "").toString().trim()} ${(
          agent?.surname || ""
        )
          .toString()
          .trim()}`
          .trim()
          .toLowerCase();
        const byCode = code ? this.agentColorByCode[code] : null;
        const byName = fullName ? this.agentColorByName[fullName] : null;
        const colorToken = byCode || byName || agent?.color || null;
        const tokenHexMap = {
          yellow: "#fde047",
          orange: "#fb923c",
          purple: "#c084fc",
          green: "#86efac",
          blue: "#93c5fd",
          pink: "#f9a8d4",
          gray: "#e5e7eb",
        };
        let bgHex = null;
        if (typeof colorToken === "string" && colorToken.startsWith("#")) {
          bgHex = colorToken;
        } else if (tokenHexMap[colorToken]) {
          bgHex = tokenHexMap[colorToken];
        }
        if (bgHex) {
          avatar.style.backgroundColor = bgHex;
          avatar.style.color = this.contrastText(bgHex);
        } else {
          avatar.className += " bg-gray-300 text-gray-700";
        }
        avatar.textContent = this.getAgentInitials(agent);
        row.appendChild(avatar);
        const label = document.createElement("span");
        label.textContent = this.getAgentDisplayName(agent);
        row.appendChild(label);
        el.appendChild(row);
      }

      // keep open when hovering tooltip itself
      el.addEventListener("mouseenter", () => {
        if (this._closeTimer) {
          clearTimeout(this._closeTimer);
          this._closeTimer = null;
        }
      });
      el.addEventListener("mouseleave", () => this.startClose());

      // no explicit Close button; hover-out closes it

      document.body.appendChild(el);
      this.tooltipEl = el;
    },
    startClose() {
      // delay slightly to allow moving into the tooltip if needed in future
      if (this._closeTimer) clearTimeout(this._closeTimer);
      this._closeTimer = setTimeout(() => {
        if (this.tooltipEl) {
          document.body.removeChild(this.tooltipEl);
          this.tooltipEl = null;
        }
      }, 80);
    },
    getAgentInitials(agent) {
      return this.agentsStore.initialsFor(agent);
    },
    getAgentDisplayName(agent) {
      return this.agentsStore.displayNameFor(agent);
    },
  },
  emits: ["edit"],
  watch: {
    appointment: {
      immediate: true,
      handler() {
        // Appointment değişikliklerini handle et
      },
    },
  },
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
