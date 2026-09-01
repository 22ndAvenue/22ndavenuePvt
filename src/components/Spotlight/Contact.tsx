"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import styles from "./Contact.module.css";
import { Mail, Instagram, Linkedin } from "lucide-react";

type ContactType = "Artists" | "Careers" | "Business";

export function Contact() {
  const [activeType, setActiveType] = useState<ContactType>("Business");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleTabChange = (type: ContactType) => {
    setActiveType(type);
    setResumeFile(null);
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const nameInput = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const emailInput = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const messageInput = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value;

    let positionStr = "";
    let noteStr = messageInput;

    if (activeType === "Business") {
      const companyInput = (form.elements.namedItem("company") as HTMLInputElement)?.value;
      positionStr = `Business Enquiry from ${companyInput || "Unknown"}`;
    } else if (activeType === "Artists") {
      const portfolioInput = (form.elements.namedItem("portfolio") as HTMLInputElement)?.value;
      positionStr = "Artist Enquiry";
      noteStr = `Portfolio/Social: ${portfolioInput}\n\nMessage:\n${messageInput}`;
    } else if (activeType === "Careers") {
      const positionInput = (form.elements.namedItem("position") as HTMLInputElement)?.value;
      positionStr = `Career Application: ${positionInput || "Unknown"}`;
    }

    if (resumeFile && resumeFile.size > 10 * 1024 * 1024) {
      alert("Resume must be under 10MB.");
      setIsSubmitting(false);
      return;
    }

    const submitData = new FormData();
    submitData.append("name", nameInput || "");
    submitData.append("email", emailInput || "");
    submitData.append("position", positionStr);
    submitData.append("note", noteStr || "");

    if (resumeFile && activeType === "Careers") {
      submitData.append("attachment", resumeFile);
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://22ndavenue-pvt.vercel.app/api/apply";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
        setResumeFile(null);
      } else {
        const result = await response.json().catch(() => ({}));
        alert(result.detail?.error || result.error || "Submission failed.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.section} id="contact-section">
      <div className={styles.backgroundGlow} />
      <div className={styles.backgroundGlow2} />

      <div className={styles.container}>
        {/* INFO SIDE */}
        <div className={styles.infoSide}>
          <ScrollReveal direction="left">
            <h2 className={styles.title}>
              Let&apos;s <span className={styles.gold}>Talk</span>
            </h2>
            <p className={styles.description}>
              We’d love to know how we can collaborate, create, or grow together
            </p>

            <div className={styles.socialIconRow}>
              <a
                href="mailto:experiences@22ndavenue.co.in"
                aria-label="Email"
                className={styles.socialIconCircle}
              >
                <Mail size={20} />
              </a>
              <a
                href="https://www.instagram.com/22ndavenuetalentmanagement/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={styles.socialIconCircle}
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/twenty-second-avenue-talent-management-company"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className={styles.socialIconCircle}
              >
                <Linkedin size={20} />
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* FORM SIDE */}
        <div className={styles.formSide}>
          <ScrollReveal direction="right" delay={200}>
            {/* Type Selector */}
            <div className={styles.typeSelector}>
              {(["Business", "Artists", "Careers"] as ContactType[]).map((type) => (
                <button
                  key={type}
                  className={`${styles.typeBtn} ${activeType === type ? styles.typeBtnActive : ""}`}
                  onClick={() => handleTabChange(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {isSubmitted ? (
              <div className={styles.successBlock}>
                <h3 className={styles.successTitle}>Thank you for reaching out to us.</h3>
                <p className={styles.successText}>
                  We acknowledge receipt of your query and are currently reviewing the details. We appreciate your patience and will get back to you with an update as soon as possible.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className={styles.resetBtn}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} key={activeType}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Full Name <span className={styles.asterisk}>*</span>
                  </label>
                  <input type="text" name="name" className={styles.input} placeholder="John Doe" required />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Email Address <span className={styles.asterisk}>*</span>
                  </label>
                  <input type="email" name="email" className={styles.input} placeholder="john@example.com" required />
                </div>

                {activeType === "Artists" && (
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Portfolio / Social Link</label>
                    <input type="url" name="portfolio" className={styles.input} placeholder="https://instagram.com/yourhandle" />
                  </div>
                )}

                {activeType === "Careers" && (
                  <>
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>Position Interested In</label>
                      <input type="text" name="position" className={styles.input} placeholder="e.g. Talent Manager" />
                    </div>
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>
                        Upload Resume / CV <span className={styles.asterisk}>*</span>
                      </label>
                      <div className={styles.fileInputWrapper}>
                        <input
                          type="file"
                          className={styles.fileInput}
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeType === "Business" && (
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Company / Brand Name</label>
                    <input type="text" name="company" className={styles.input} placeholder="Your Company Ltd." />
                  </div>
                )}

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    Your Message <span className={styles.asterisk}>*</span>
                  </label>
                  <textarea
                    name="message"
                    className={styles.textarea}
                    placeholder={`Tell us about your ${activeType === "Artists" ? "art" : activeType === "Careers" ? "experience" : "business enquiry"}...`}
                    required
                  ></textarea>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
