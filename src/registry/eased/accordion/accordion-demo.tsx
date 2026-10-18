"use client";

import { DemoFrame } from "../lib/demo-frame";
import { Accordion, AccordionItem } from "./accordion";

export function AccordionDemo() {
  return (
    <DemoFrame title="Billing help" meta="4 questions">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-1">
        <Accordion defaultValue={["charged"]}>
          <AccordionItem value="charged" title="When am I charged?">
            On the day your trial ends, then on the same date every month. If that date doesn’t exist in a month, such as
            the 31st, we charge on the last day instead.
          </AccordionItem>
          <AccordionItem value="switch" title="Can I change plans mid-cycle?">
            Yes. Upgrades apply at once and you pay the difference for the days left in the cycle. Downgrades take effect at
            your next renewal, so you keep what you paid for.
          </AccordionItem>
          <AccordionItem value="refund" title="Do you offer refunds?">
            Within 14 days of any charge, in full, no questions asked.
          </AccordionItem>
          <AccordionItem value="vat" title="How do I add a VAT number to my invoices?">
            <p>
              Go to Settings → Billing → Tax details and enter it with its country prefix, for example DE123456789. We
              check it against VIES before saving.
            </p>
            <p className="mt-2">
              New invoices show it from then on. To reissue a past invoice with the number on it, open the invoice and
              choose Regenerate.
            </p>
          </AccordionItem>
        </Accordion>
      </div>
    </DemoFrame>
  );
}
