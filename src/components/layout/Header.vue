<template>
  <nav class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold text-gray-800">
          {{ $t("common.appTitle") }}
        </h1>

        <!-- Dil Seçimi -->
        <div class="flex items-center space-x-4">
          <Button
            :class="{ 'p-button-outlined': $i18n.locale !== 'tr' }"
            @click="changeLanguage('tr')"
            class="p-button-sm"
          >
            TR
          </Button>
          <Button
            :class="{ 'p-button-outlined': $i18n.locale !== 'en' }"
            @click="changeLanguage('en')"
            class="p-button-sm"
          >
            EN
          </Button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: "Header",
  methods: {
    changeLanguage(lang) {
      this.$i18n.locale = lang;
    },
  },
};
</script>
