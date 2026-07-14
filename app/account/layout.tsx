import { AccountSettingsShell } from "./components/account-settings-shell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountSettingsShell>{children}</AccountSettingsShell>;
}
