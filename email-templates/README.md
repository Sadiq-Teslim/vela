# Email Template Setup Guide

## 📧 Confirm Signup Email Template

This is your custom email template for Supabase email confirmations. It's fully branded with Vela colors, typography, and messaging.

### Design System Applied

✨ **Colors:**

- Primary: `#0d1830` (Dark navy)
- Accent: Gradient from Cyan (`#0097a7`) to Mint (`#059669`)
- Background: `#f8f9fb` (Light gray)
- Surface: `#ffffff` (White)

🎨 **Typography:**

- Display: Syne (bold, modern)
- Body: Outfit (clean, readable)
- Sizes optimized for email clients

📱 **Features:**

- Fully responsive on mobile
- Dark mode safe (inline styles)
- Accessible color contrast
- Fallback link for clients with CSS issues
- Feature highlights showcasing Vela's value prop

### How to Deploy in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Email Templates**

2. **Find "Confirm signup" template**
   - Click the edit icon
   - Copy the entire HTML from `confirm-signup.html`
   - Paste into the Supabase editor

3. **Configure Redirect URLs**
   - Go to **Authentication** → **URL Configuration**
   - Add both URLs:
     ```
     http://localhost:3000/auth/callback
     https://use-vela.netlify.app/auth/callback
     ```

4. **Test the Email**
   - Sign up on your dev site
   - Check email for the confirmation link
   - Verify the branding and links work correctly

### Template Variables

The template uses these Supabase variables (they auto-populate):

- `{{ .ConfirmationURL }}` — The magic link to verify email
- `{{ .SiteURL }}` — Your app URL
- `{{ .Email }}` — The user's email address

### Customization Tips

**To change colors:**

- Modify the hex values in the `<style>` section
- Reference the colors in `apps/web/app/globals.css`

**To add/remove features:**

- Edit the `.features` section
- Keep emoji + text pairs for visual consistency

**To use logo image instead of SVG:**
Replace the inline SVG with:

```html
<img
  src="https://use-vela.netlify.app/logos/vela-logo-light.svg"
  alt="Vela"
  height="40"
/>
```

### Files Included

- `confirm-signup.html` — Production-ready email template
- This README with setup instructions

### Support

For questions about email customization in Supabase, see:
https://supabase.com/docs/guides/auth/custom-email-templates
