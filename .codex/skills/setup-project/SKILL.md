---
name: setup-project
description: Use this skill when scaffolding the GovLeave Next.js project from scratch, setting up folder structure, installing dependencies, configuring environment variables, and wiring up the root layout with providers and AntdRegistry.
---

# GovLeave — Project Setup

## Tech Stack

| Tool                     | Purpose                           |
| ------------------------ | --------------------------------- |
| Next.js 16+ (App Router) | Frontend framework                |
| TypeScript               | Type safety                       |
| Ant Design (`antd`)      | UI component library              |
| `antd-style`             | CSS-in-JS styling                 |
| `redux-actions`          | Action creators + reducer helpers |
| `axios`                  | HTTP client                       |
| `js-cookie`              | Token persistence                 |

---

## Install Dependencies

```bash
npm install antd antd-style @ant-design/nextjs-registry
npm install axios js-cookie redux-actions
npm install @types/js-cookie @types/redux-actions --save-dev
```

---

## Folder Structure (STRICT — never deviate)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── styles/
│   │   │       └── style.ts
│   │   └── register/
│   │       ├── page.tsx
│   │       └── styles/
│   │           └── style.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── styles/style.ts
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   └── styles/style.ts
│   │   ├── departments/
│   │   │   ├── page.tsx
│   │   │   └── styles/style.ts
│   │   └── leaves/
│   │       ├── page.tsx
│   │       └── styles/style.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   └── PageHeader.tsx
│   ├── employees/
│   ├── departments/
│   └── leaves/
├── hoc/
│   └── withAuth.tsx
├── providers/
│   ├── index.tsx
│   ├── auth-provider/
│   ├── employee-provider/
│   ├── department-provider/
│   └── leave-provider/
└── utils/
    └── axiosInstance.ts
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:44311
```

---

## Root Layout

```typescript
// app/layout.tsx
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppProviders } from '@/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AppProviders>
            {children}
          </AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

---

## axiosInstance.ts (CANONICAL — never rewrite, always import)

```typescript
// src/utils/axiosInstance.ts
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:21021";
const TOKEN_KEY = "govleave_token";

export const getAxiosInstance = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use((config) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        Cookies.remove(TOKEN_KEY);
        window.location.href = "/login";
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

export const setAuthToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 1,
    secure: true,
    sameSite: "strict",
  });
};

export const removeAuthToken = () => Cookies.remove(TOKEN_KEY);
export const getAuthToken = () => Cookies.get(TOKEN_KEY);
```

---

## withAuth HOC

```typescript
// hoc/withAuth.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/auth-provider";
import { getAuthToken } from "@/utils/axiosInstance";
import { Spin } from "antd";

export function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const router = useRouter();
    const { isAuthenticated, isPending } = useAuthState();
    const token = getAuthToken();

    useEffect(() => {
      if (!isPending && !isAuthenticated && !token) {
        router.replace('/login');
      }
    }, [isAuthenticated, isPending, token, router]);

    if (isPending) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!isAuthenticated && !token) return null;

    return <WrappedComponent {...props} />;
  };
}
```

---

## Providers Composition

```typescript
// providers/index.tsx
"use client";
import { AuthProvider } from "./auth-provider";
import { EmployeeProvider } from "./employee-provider";
import { DepartmentProvider } from "./department-provider";
import { LeaveProvider } from "./leave-provider";

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <DepartmentProvider>
      <EmployeeProvider>
        <LeaveProvider>
          {children}
        </LeaveProvider>
      </EmployeeProvider>
    </DepartmentProvider>
  </AuthProvider>
);
```
