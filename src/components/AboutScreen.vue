<template>
  <section class="about-section">
    <div class="card hero-card">
      <p class="eyebrow">About</p>
      <h2>Battery Passport Portal</h2>
      <p class="lead">
        The Battery Passport Portal is a Vue-based web application for exploring digital battery
        passport data aligned with the OPENAPI Digital Battery Passport specification.
      </p>
    </div>

    <div class="about-grid">
      <article class="card">
        <h3>What it does</h3>
        <p>
          The portal supports searching battery passports by manufacturer and battery identifier,
          opening deep links directly to a passport, and reviewing structured passport content in a
          readable interface.
        </p>
        <p class="detail-block">
          Example deep link:
          <code>&lt;portal url&gt;/manufacturer/DAF/battery/BAT-1001</code>
        </p>
      </article>

      <article class="card">
        <h3>Admin capabilities</h3>
        <p>
          Authenticated users can manage manufacturer registrations, inspect API call logs, and
          browse registered manufacturer passport lists through the protected screens.
        </p>
      </article>

      <article class="card">
        <h3>Technology</h3>
        <p>
          The webportal is built with Vue 3, TypeScript, Vite, and lightweight client-side routing,
          with browser storage used for local demo authentication and manufacturer configuration.
        </p>
        <p class="detail-block">
          Source repository:
          <a href="https://github.com/CIMBATT/DBP-WebPortal" target="_blank" rel="noopener">
            https://github.com/CIMBATT/DBP-WebPortal
          </a>
        </p>
      </article>

      <article class="card">
        <h3>Digital battery passport</h3>
        <p>
          The portal uses a digital battery passport structure aligned with the OPENAPI Digital
          Battery Passport specification. The passport model covers core sections such as general
          product information, material composition, performance, carbon footprint, circularity,
          supply chain due diligence, labeling, and dynamic lifecycle updates.
        </p>
        <p class="detail-block">
          OPENAPI specification used:
          <a
            href="https://cimbatt.github.io/DBP-OpenAPI/OpenAPI/swagger/public_api/index.html"
            target="_blank"
            rel="noopener"
          >
            https://cimbatt.github.io/DBP-OpenAPI/OpenAPI/swagger/public_api/index.html
          </a>
        </p>
      </article>

      <article class="card">
        <h3>Licensing</h3>
        <p>
          This webportal is distributed under the Apache License 2.0. See the included license file
          in the project root of the webportal for details.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about-section {
  display: grid;
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.04);
}

.hero-card h2,
.card h3 {
  margin: 0 0 12px;
  color: #0f172a;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  color: #64748b;
}

.lead,
.card p {
  margin: 0;
  color: #334155;
  line-height: 1.65;
}

.detail-block {
  margin-top: 16px;
}

a {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

a:hover {
  text-decoration: underline;
}

code {
  display: inline-block;
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #e2e8f0;
  color: #0f172a;
  font-family: 'Courier New', monospace;
  font-size: 0.84rem;
  word-break: break-all;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
</style>
