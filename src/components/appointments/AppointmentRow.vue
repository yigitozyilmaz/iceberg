<template>
  <div
    class="pl-16 pr-4 py-3 flex items-center justify-evenly w-full overflow-hidden"
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
      class="flex items-center gap-2 font-medium text-gray-900 truncate min-w-[220px] basis-1/4 min-w-0"
    >
      <i class="pi pi-home text-gray-400 text-xs" />
      <span class="truncate">{{
        formatArrayLike(appointment?.appointment_address)
      }}</span>
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
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white shadow-sm',
            agentClassWithFallback(agent),
          ]"
          :title="getAgentDisplayName(agent)"
        >
          {{ getAgentInitials(agent) }}
        </div>
        <div v-if="extraCount > 0" class="relative group">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white bg-gray-200 text-gray-700 shadow-sm"
          >
            +{{ extraCount }}
          </div>
          <div
            class="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white border border-gray-200 rounded-md shadow-lg p-2 text-xs text-gray-700 whitespace-nowrap z-10"
          >
            <div
              v-for="(agent, i) in overflowAgents"
              :key="i"
              class="leading-5"
            >
              {{ getAgentDisplayName(agent) }}
            </div>
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
      return "bg-[#FF2D87]";
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
      const colorToken = agent?.color || this.randomColor();
      const colors = {
        yellow: "bg-yellow-300 text-yellow-900",
        orange: "bg-orange-300 text-orange-900",
        purple: "bg-purple-300 text-purple-900",
        green: "bg-green-300 text-green-900",
        blue: "bg-blue-300 text-blue-900",
        pink: "bg-pink-300 text-pink-900",
        gray: "bg-gray-300 text-gray-700",
      };
      return colors[colorToken] || colors.gray;
    },
    randomColor() {
      const palette = [
        "yellow",
        "orange",
        "purple",
        "green",
        "blue",
        "pink",
        "gray",
      ];
      const index = Math.floor(Math.random() * palette.length);
      return palette[index];
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
  watch: {
    appointment: {
      immediate: true,
      handler() {
        // eslint-disable-next-line no-console
        console.log(
          "[Row] agents for",
          this.appointment?.id,
          this.computedAgents
        );
      },
    },
  },
};
</script>
