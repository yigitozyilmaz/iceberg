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
          formatArrayLike(appointment?.contact_name)
        }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <i class="pi pi-envelope text-gray-400 text-xs" />
        <span class="truncate">{{
          formatArrayLike(appointment?.contact_email)
        }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <i class="pi pi-phone text-gray-400 text-xs" />
        <span class="truncate">{{
          formatArrayLike(appointment?.contact_phone)
        }}</span>
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
          :class="[
            'rounded-full flex items-center justify-center text-sm font-semibold border-2 border-white shadow-sm',
            agentClassWithFallback(agent),
          ]"
          :style="agentStyle(agent)"
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
    agentClassWithFallback(agent) {
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
      const colorToken = byCode || byName || agent?.color || "gray";
      const colors = {
        yellow: "bg-yellow-300 text-yellow-900",
        orange: "bg-orange-300 text-orange-900",
        purple: "bg-purple-300 text-purple-900",
        green: "bg-green-300 text-green-900",
        blue: "bg-blue-300 text-blue-900",
        pink: "bg-pink-300 text-pink-900",
        gray: "bg-gray-300 text-gray-700",
      };
      if (colors[colorToken]) return colors[colorToken];
      return colors.gray;
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
      const byCode = code ? this.agentColorByCode[code] : null;
      const byName = fullName ? this.agentColorByName[fullName] : null;
      const colorToken = byCode || byName || agent?.color || null;
      if (typeof colorToken === "string" && colorToken.startsWith("#")) {
        return {
          backgroundColor: colorToken,
          color: this.contrastText(colorToken),
        };
      }
      return null;
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
      const firstName = Array.isArray(agent?.name)
        ? agent.name[0]
        : agent?.name;
      const lastName = Array.isArray(agent?.surname)
        ? agent.surname[0]
        : agent?.surname;
      const f = (firstName || "").toString().trim();
      const l = (lastName || "").toString().trim();
      if (f || l) {
        const fi = f ? f[0] : "";
        const li = l ? l[0] : "";
        return (fi + li).toUpperCase() || "??";
      }
      const source = (agent?.code || "").toString().trim();
      if (source) return source.slice(0, 2).toUpperCase();
      return "??";
    },
    getAgentDisplayName(agent) {
      const firstName = Array.isArray(agent?.name)
        ? agent.name[0]
        : agent?.name;
      const lastName = Array.isArray(agent?.surname)
        ? agent.surname[0]
        : agent?.surname;
      const f = (firstName || "").toString().trim();
      const l = (lastName || "").toString().trim();
      const code = (agent?.code || "").toString().trim();
      return f || l ? `${f} ${l}`.trim() : code || "Agent";
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
