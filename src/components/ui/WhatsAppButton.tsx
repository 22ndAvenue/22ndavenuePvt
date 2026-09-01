"use client";

import { MessageCircle } from "lucide-react";
import styles from "./WhatsAppButton.module.css";

export function WhatsAppButton() {
  const whatsappNumber = "919152825124";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsappBtn}
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle size={24} />
      <span className={styles.tooltip}>Chat with us</span>
    </a>
  );
}
