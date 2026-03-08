

## Connect a Custom Domain

This doesn't require code changes — it's a configuration step in the Lovable editor.

### Steps to connect `chopacosmetics.com`:

1. **In Lovable**: Go to **Settings → Domains → Connect Domain** and enter `chopacosmetics.com`.
2. **At your domain registrar** (wherever you bought the domain), add these DNS records:

```text
Type   Name        Value
─────  ──────────  ─────────────────
A      @           185.158.133.1
A      www         185.158.133.1
TXT    _lovable    (provided by Lovable during setup)
```

3. **Add both domains** in Lovable: `chopacosmetics.com` and `www.chopacosmetics.com`. Set one as **Primary** so the other redirects to it.
4. **Wait for DNS propagation** — can take up to 72 hours. SSL is provisioned automatically once verified.

### How to access Settings → Domains:

- **Desktop**: Click project name (top left) → Settings → Domains tab
- **Mobile**: Tap project name (top of screen) → Settings → Domains tab

A paid Lovable plan is required to connect a custom domain.

