<template>
  <footer class="cf-footer">
    <div class="cf-container cf-footer-grid">
      <section>
        <h3>{{ $t('footer.aboutTitle') }}</h3>
        <p>
          {{ $t('footer.aboutDescription') }}
        </p>
      </section>

      <section>
        <h3>{{ $t('footer.quickLinks') }}</h3>
        <ul>
          <li><RouterLink to="/home" class="cf-link">{{ $t('common.home') }}</RouterLink></li>
          <li><RouterLink to="/add" class="cf-link">{{ $t('common.addPost') }}</RouterLink></li>
          <li><RouterLink to="/profile" class="cf-link">{{ $t('common.profile') }}</RouterLink></li>

          <!-- NEW DONATION PAGE LINK -->
          <li><RouterLink to="/support" class="cf-link">{{ $t('footer.supportUs') }}</RouterLink></li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('footer.contact') }}</h3>
        <p>{{ $t('footer.email') }}</p>
        <p>{{ $t('footer.github') }}</p>
      </section>
    </div>
    <div class="cf-footer-copy">{{ $t('footer.copyright') }}</div>
  </footer>
</template>

<script setup lang="ts"></script>
