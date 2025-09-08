<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    :header="isEdit ? $t('appointments.edit') : $t('appointments.new')"
    :modal="true"
    :style="{ width: '50vw' }"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {{ $t("appointments.fields.date") }}
        </label>
        <Calendar
          v-model="formData.appointment_date"
          showTime
          :minDate="new Date()"
          dateFormat="dd/mm/yy"
          class="w-full"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {{ $t("appointments.fields.address") }}
        </label>
        <InputText
          v-model="formData.appointment_address"
          class="w-full"
          :placeholder="$t('appointments.placeholders.address')"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {{ $t("appointments.fields.contactName") }}
        </label>
        <InputText
          v-model="formData.contact_name"
          class="w-full"
          :placeholder="$t('appointments.placeholders.contactName')"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {{ $t("appointments.fields.contactEmail") }}
        </label>
        <InputText
          v-model="formData.contact_email"
          type="email"
          class="w-full"
          :placeholder="$t('appointments.placeholders.contactEmail')"
        />
      </div>

      <div v-if="isEdit" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {{ $t("appointments.fields.status") }}
        </label>
        <Dropdown
          v-model="formData.is_cancelled"
          :options="[
            { label: $t('appointments.status.active'), value: false },
            { label: $t('appointments.status.cancelled'), value: true },
          ]"
          optionLabel="label"
          optionValue="value"
          :placeholder="$t('appointments.fields.status')"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <Button
        :label="$t('common.cancel')"
        icon="pi pi-times"
        @click="$emit('update:modelValue', false)"
        class="p-button-text"
      />
      <Button
        :label="$t('common.save')"
        icon="pi pi-check"
        @click="$emit('save', formData)"
        :loading="loading"
        autofocus
      />
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
  },
  emits: ["update:modelValue", "save"],
  data() {
    return {
      formData: this.getEmptyForm(),
    };
  },
  computed: {
    isEdit() {
      return !!this.appointment;
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
        } else {
          this.formData = this.getEmptyForm();
        }
      },
    },
  },
  methods: {
    getEmptyForm() {
      return {
        appointment_date: new Date(),
        appointment_address: "",
        contact_name: "",
        contact_email: "",
        is_cancelled: false,
      };
    },
  },
};
</script>
