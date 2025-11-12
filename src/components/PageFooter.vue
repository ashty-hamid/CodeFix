<template>
  <footer class="cf-footer">
    <div class="cf-container cf-footer-grid">
      <section>
        <h3>About CodeFix</h3>
        <p>
          A community platform for programmers to share coding errors and get help fixing them.
          Connect with developers worldwide and solve problems together.
        </p>
      </section>

      <section>
        <h3>Quick Links</h3>
        <ul>
          <li><RouterLink to="/home" class="cf-link">Home</RouterLink></li>
          <li><RouterLink to="/add" class="cf-link">Add Post</RouterLink></li>
          <li><RouterLink to="/profile" class="cf-link">Profile</RouterLink></li>
        </ul>
      </section>

      <section>
        <h3>Contact</h3>
        <p>Email: support@codefix.dev</p>
        <p>GitHub: github.com/codefix</p>
      </section>
    </div>
    <div class="cf-footer-copy">© 2025 CodeFix — All rights reserved.</div>
  </footer>
</template>

<script setup lang="ts"></script>
