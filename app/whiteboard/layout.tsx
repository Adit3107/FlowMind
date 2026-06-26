import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whiteboard | Flowbase",
  description: "Miro-style collaborative whiteboard canvas.",
};

export default function WhiteboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
