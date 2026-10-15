import { StickyChapter } from "@/components/layout/StickyChapter";
import { getCopy } from "@/content/copy";
import { siteConfig } from "@/content/site";

/**
 * Closing call to action. The site is a non-commercial portfolio concept:
 * the CTA is a contact link for the project, never a sales or lead form.
 */
export function ContactSection() {
  const copy = getCopy().contact;
  const { contactHref } = siteConfig;
  return (
    <StickyChapter id="contact" copy={copy} length={150}>
      <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
        {contactHref ? (
          <a
            href={contactHref}
            className="inline-flex items-center gap-4 border border-silver-500/40 px-8 py-4 text-eyebrow uppercase text-silver-100 transition-colors duration-500 ease-cinematic hover:border-silver-100 hover:text-silver-50"
          >
            <span aria-hidden className="h-px w-6 bg-signal" />
            {copy.cta}
          </a>
        ) : (
          <p className="text-sm text-silver-500">{copy.unavailable}</p>
        )}
        <a
          href="#hero"
          className="text-eyebrow uppercase text-silver-400 transition-colors duration-500 ease-cinematic hover:text-silver-50"
        >
          {copy.backToTop}
        </a>
      </div>
    </StickyChapter>
  );
}
