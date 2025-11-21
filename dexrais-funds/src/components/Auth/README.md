# Authentication Modals

## Usage

### LoginModal

```tsx
import { LoginModal } from '@/components/Auth';
import { useState } from 'react';

function YourComponent() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      <button onClick={() => setShowLogin(true)}>Login</button>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
    </>
  );
}
```

### RegisterModal

```tsx
import { RegisterModal } from '@/components/Auth';
import { useState } from 'react';

function YourComponent() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      <button onClick={() => setShowRegister(true)}>Register</button>

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}
```

## Features

### LoginModal
- Email + Password authentication
- WalletConnect integration
- Forgot password link
- Switch to register modal
- Glassmorphic design
- Responsive layout

### RegisterModal
- Email + Password registration
- Password confirmation
- Terms & Conditions checkbox
- WalletConnect after registration
- Switch to login modal
- Glassmorphic design
- Responsive layout

## Integration

These modals integrate with:
- **Supabase** for email/password authentication (TODO: implement)
- **WalletConnect** via `@reown/appkit` for Web3 wallet authentication
- **AuthContext** for managing authentication state

## Styling

Both modals use the glassmorphic design system matching the rest of DexRais.funds:
- Satoshi font
- Small text sizes (text-xs, text-sm)
- Backdrop blur effects
- Smooth animations
- Gray color palette
