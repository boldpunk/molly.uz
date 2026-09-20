"use client";

/* eslint-disable @next/next/no-img-element */

import { useLayoutEffect, useRef, useState } from "react";
import type { Proposal, ProposalCompanyInfo } from "@/lib/proposal-types";
import { formatMoney, formatQuantity } from "@/lib/proposal-money";
import {
  formatProposalDate,
  proposalStrings,
  unitLabel,
} from "@/lib/proposal-i18n";
import { contrastText, readableAccent, withAlpha } from "@/lib/proposal-theme";
import { CornerJointMark } from "@/components/icons/brand-mark";

// A4 at 96dpi, minus the page margin baked into `.kp-page` padding below.
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PAGE_PADDING_PX = 38;
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - PAGE_PADDING_PX * 2;
const FOOTER_RESERVE_PX = 74;
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_PX * 2 - FOOTER_RESERVE_PX;

interface PagePlan {
  intro: boolean;
  items: number[];
  outro: boolean;
}

export function ProposalDocument({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: ProposalCompanyInfo;
}) {
  const t = proposalStrings(proposal.language);
  const accent = proposal.themeColor;
  const accentText = readableAccent(accent);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PagePlan[] | null>(null);

  // Chrome can't print "page N of M" from CSS (it has no @page margin boxes),
  // so the document is packed into explicit A4 pages here: every block is
  // measured once at the real content width and greedily placed. Item photos
  // sit in fixed-height boxes so a late-loading image can never change a row's
  // height after the split has been decided.
  useLayoutEffect(() => {
    let cancelled = false;

    async function paginate() {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (cancelled) return;

      const root = measureRef.current;
      if (!root) return;
      const height = (selector: string) =>
        (root.querySelector(selector) as HTMLElement | null)?.offsetHeight ?? 0;

      const introH = height("[data-measure='intro']");
      const tableHeadH = height("[data-measure='table-head']");
      const outroH = height("[data-measure='outro']");
      const itemHeights = proposal.items.map((_, index) =>
        height(`[data-measure='item-${index}']`)
      );

      const plan: PagePlan[] = [];
      let current: PagePlan = { intro: true, items: [], outro: false };
      let remaining = CONTENT_HEIGHT_PX - introH - tableHeadH;

      itemHeights.forEach((itemHeight, index) => {
        if (itemHeight > remaining && current.items.length > 0) {
          plan.push(current);
          current = { intro: false, items: [], outro: false };
          remaining = CONTENT_HEIGHT_PX - tableHeadH;
        }
        current.items.push(index);
        remaining -= itemHeight;
      });

      if (outroH > remaining && (current.intro || current.items.length > 0)) {
        plan.push(current);
        current = { intro: false, items: [], outro: true };
      } else {
        current.outro = true;
      }
      plan.push(current);

      if (!cancelled) setPages(plan);
    }

    void paginate();
    return () => {
      cancelled = true;
    };
  }, [proposal]);

  const intro = <IntroBlock proposal={proposal} company={company} />;
  const tableHead = <TableHead proposal={proposal} />;
  const outro = <OutroBlock proposal={proposal} />;

  return (
    <>
      <DocumentStyles />

      {/* Off-screen measuring pass: same width and styles as a real page. */}
      <div
        ref={measureRef}
        aria-hidden
        className="kp-measure"
        style={{ width: CONTENT_WIDTH_PX }}
      >
        <div data-measure="intro">{intro}</div>
        <div data-measure="table-head">{tableHead}</div>
        {proposal.items.map((item, index) => (
          <div key={item.id} data-measure={`item-${index}`}>
            <ItemRow proposal={proposal} item={item} />
          </div>
        ))}
        <div data-measure="outro">{outro}</div>
      </div>

      <div className="kp-doc" style={{ ["--kp-accent" as string]: accent }}>
        {pages === null ? (
          <div className="kp-loading">Готовим документ…</div>
        ) : (
          pages.map((page, pageIndex) => (
            <section className="kp-page" key={pageIndex}>
              <div className="kp-page-body">
                {page.intro && intro}
                {page.items.length > 0 && (
                  <>
                    {tableHead}
                    {page.items.map((itemIndex) => (
                      <ItemRow
                        key={proposal.items[itemIndex].id}
                        proposal={proposal}
                        item={proposal.items[itemIndex]}
                      />
                    ))}
                  </>
                )}
                {page.outro && outro}
              </div>
              <PageFooter
                company={company}
                accentText={accentText}
                label={`${t.page} ${pageIndex + 1} / ${pages.length}`}
              />
            </section>
          ))
        )}
      </div>
    </>
  );
}

function IntroBlock({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: ProposalCompanyInfo;
}) {
  const t = proposalStrings(proposal.language);
  const accent = proposal.themeColor;
  const accentText = readableAccent(accent);

  const clientLines = [
    proposal.clientCompany,
    proposal.clientPhone ? `${t.phone} ${proposal.clientPhone}` : "",
    proposal.clientAddress,
  ].filter(Boolean);
  const preparedLines = [
    company.name,
    proposal.preparedByPhone ? `${t.phone} ${proposal.preparedByPhone}` : "",
  ].filter(Boolean);

  return (
    <div>
      <header className="kp-head">
        <div className="kp-head-brand">
          <div className="kp-logo" style={{ borderColor: withAlpha(accent, 0.5) }}>
            <CornerJointMark style={{ width: 28, height: 28 }} />
          </div>
          <div>
            <p className="kp-company">{company.name}</p>
            {company.tagline && (
              <p className="kp-tagline" style={{ color: accentText }}>
                {company.tagline}
              </p>
            )}
            {company.phone && <p className="kp-company-phone">{company.phone}</p>}
          </div>
        </div>
        <div className="kp-head-meta">
          <span className="kp-badge">{t.documentTitle}</span>
          <p className="kp-number">
            #{proposal.number}
            <span className="kp-number-sep">|</span>
            <span style={{ color: accentText }}>
              {formatProposalDate(proposal.proposalDate)}
            </span>
          </p>
        </div>
      </header>

      {(proposal.clientName || proposal.preparedByName) && (
        <div className="kp-parties">
          {proposal.clientName && (
            <div className="kp-party">
              <p className="kp-party-label" style={{ color: accentText }}>
                {t.client}
              </p>
              <p className="kp-party-name">{proposal.clientName}</p>
              {clientLines.map((line) => (
                <p key={line} className="kp-party-line">
                  {line}
                </p>
              ))}
            </div>
          )}
          {proposal.preparedByName && (
            <div className="kp-party">
              <p className="kp-party-label" style={{ color: accentText }}>
                {t.preparedBy}
              </p>
              <p className="kp-party-name">{proposal.preparedByName}</p>
              {preparedLines.map((line) => (
                <p key={line} className="kp-party-line">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {proposal.projectName && (
        <p className="kp-project">{proposal.projectName}</p>
      )}

      {proposal.brands.length > 0 && (
        <div className="kp-partners">
          <p className="kp-section-label" style={{ color: accentText }}>
            {t.partners}
          </p>
          <div className="kp-partner-row">
            {proposal.brands.map((brand) =>
              brand.logoUrl ? (
                <img
                  key={brand.name}
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="kp-partner-logo"
                />
              ) : (
                <span key={brand.name} className="kp-partner-name">
                  {brand.name}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TableHead({ proposal }: { proposal: Proposal }) {
  const t = proposalStrings(proposal.language);
  const accentText = readableAccent(proposal.themeColor);
  return (
    <div
      className="kp-row kp-row-head"
      style={{ color: accentText, borderColor: withAlpha(proposal.themeColor, 0.35) }}
    >
      <div>{t.columnImage}</div>
      <div>{t.columnProduct}</div>
      <div className="kp-center">{t.columnQuantity}</div>
      <div className="kp-right">{t.columnPrice}</div>
      <div className="kp-right">{t.columnTotal}</div>
    </div>
  );
}

function ItemRow({
  proposal,
  item,
}: {
  proposal: Proposal;
  item: Proposal["items"][number];
}) {
  const t = proposalStrings(proposal.language);
  return (
    <div className="kp-row kp-row-item">
      <div className="kp-thumb">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" />
        ) : (
          <span className="kp-thumb-empty" />
        )}
      </div>
      <div className="kp-item-main">
        {item.name && <p className="kp-item-name">{item.name}</p>}
        {item.description && (
          <p className="kp-item-desc">{item.description}</p>
        )}
        {item.dimensions && (
          <p className="kp-item-dims">
            {t.dimensions}: {item.dimensions}
          </p>
        )}
      </div>
      <div className="kp-center kp-item-qty">
        <span>{formatQuantity(item.quantityMilli)}</span>
        <span className="kp-unit">{unitLabel(item.unit, proposal.language)}</span>
      </div>
      <div className="kp-right kp-item-price">
        {formatMoney(item.unitPriceMinor, proposal.currency, {
          language: proposal.language,
        })}
      </div>
      <div className="kp-right kp-item-total">
        {formatMoney(item.totalMinor, proposal.currency, {
          language: proposal.language,
        })}
      </div>
    </div>
  );
}

function OutroBlock({ proposal }: { proposal: Proposal }) {
  const t = proposalStrings(proposal.language);
  const accent = proposal.themeColor;
  const accentText = readableAccent(accent);
  const onAccent = contrastText(accent);

  return (
    <div className="kp-outro">
      <div className="kp-summary">
        {proposal.deadline && (
          <div className="kp-deadline">
            <p className="kp-section-label" style={{ color: accentText }}>
              {t.deadline}
            </p>
            <p className="kp-deadline-value" style={{ color: accentText }}>
              {proposal.deadline}
            </p>
          </div>
        )}
        <div className="kp-total-card">
          <div className="kp-total-sub">
            <span>{t.itemsTotal}</span>
            <span>
              {formatMoney(proposal.subtotalMinor, proposal.currency, {
                language: proposal.language,
              })}
            </span>
          </div>
          <div className="kp-total-main">
            <span>{t.grandTotal}</span>
            <span
              className="kp-total-value"
              style={{
                background: accent,
                color: onAccent,
              }}
            >
              {formatMoney(proposal.totalMinor, proposal.currency, {
                language: proposal.language,
              })}
            </span>
          </div>
          {proposal.validityNote && (
            <p className="kp-total-note">* {proposal.validityNote}</p>
          )}
        </div>
      </div>

      {proposal.finalText && (
        <p className="kp-final-text">{proposal.finalText}</p>
      )}

      <div className="kp-signatures">
        <div>
          <p className="kp-sign-closing">{t.signatureClosing}</p>
          <div className="kp-sign-line" />
          <p className="kp-sign-role">{t.signatureStaff}</p>
        </div>
        <div>
          <p className="kp-sign-closing">&nbsp;</p>
          <div className="kp-sign-line" />
          <p className="kp-sign-role">{t.signatureClient}</p>
        </div>
      </div>
    </div>
  );
}

function PageFooter({
  company,
  accentText,
  label,
}: {
  company: ProposalCompanyInfo;
  accentText: string;
  label: string;
}) {
  const contacts = [
    company.instagram ? `@${company.instagram}` : "",
    company.telegram ? `@${company.telegram}` : "",
    company.website,
  ].filter(Boolean);

  return (
    <footer className="kp-footer">
      <div>
        <p className="kp-footer-name">{company.name}</p>
        {company.address && (
          <p className="kp-footer-line">{company.address}</p>
        )}
      </div>
      <div className="kp-footer-right">
        <p className="kp-footer-line">{contacts.join("  ·  ")}</p>
        <p className="kp-footer-page" style={{ color: accentText }}>
          {label}
        </p>
      </div>
    </footer>
  );
}

function DocumentStyles() {
  return (
    <style>{`
      .kp-measure {
        position: absolute;
        left: -10000px;
        top: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .kp-doc, .kp-measure {
        font-family: var(--font-sans, system-ui), sans-serif;
        color: #1b1b1d;
        font-size: 11px;
        line-height: 1.45;
      }
      .kp-loading {
        padding: 80px 0;
        text-align: center;
        color: rgba(24, 43, 76, 0.4);
        font-size: 13px;
      }
      .kp-page {
        position: relative;
        width: ${PAGE_WIDTH_PX}px;
        min-height: ${PAGE_HEIGHT_PX}px;
        padding: ${PAGE_PADDING_PX}px;
        margin: 0 auto 24px;
        background: #fff;
        box-shadow: 0 6px 30px rgba(20, 30, 50, 0.12);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .kp-page-body { flex: 1; }

      .kp-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(20, 20, 20, 0.08);
      }
      .kp-head-brand { display: flex; align-items: center; gap: 12px; }
      .kp-logo {
        width: 44px; height: 44px;
        border: 1.5px solid;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-heading, Georgia), serif;
        font-size: 22px; font-weight: 700;
      }
      .kp-company {
        font-family: var(--font-heading, Georgia), serif;
        font-size: 16px; font-weight: 700; letter-spacing: -0.01em;
      }
      .kp-tagline { font-size: 10px; font-style: italic; margin-top: 1px; }
      .kp-company-phone { font-size: 10px; color: rgba(20,20,20,0.5); margin-top: 2px; }
      .kp-head-meta { text-align: right; }
      .kp-badge {
        display: inline-block;
        background: #16130f; color: #fff;
        font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
        padding: 7px 14px; border-radius: 4px;
        text-transform: uppercase;
      }
      .kp-number {
        margin-top: 7px; font-size: 11px; font-weight: 600;
        color: rgba(20,20,20,0.55);
      }
      .kp-number-sep { margin: 0 6px; color: rgba(20,20,20,0.25); }

      .kp-parties {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        margin-top: 16px;
      }
      .kp-party {
        background: rgba(20, 20, 20, 0.025);
        border: 1px solid rgba(20, 20, 20, 0.06);
        border-radius: 8px; padding: 12px 14px;
      }
      .kp-party-label {
        font-size: 8px; font-weight: 700; letter-spacing: 0.14em;
        text-transform: uppercase; margin-bottom: 5px;
      }
      .kp-party-name { font-size: 13px; font-weight: 700; }
      .kp-party-line { font-size: 10px; color: rgba(20,20,20,0.6); margin-top: 2px; }

      .kp-project {
        margin-top: 12px; font-size: 12px; font-weight: 600;
        color: rgba(20,20,20,0.75);
      }

      .kp-partners { margin-top: 16px; }
      .kp-section-label {
        font-size: 8px; font-weight: 700; letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .kp-partner-row {
        display: flex; flex-wrap: wrap; align-items: center;
        gap: 18px; margin-top: 10px;
      }
      .kp-partner-logo { height: 22px; width: auto; max-width: 110px; object-fit: contain; }
      .kp-partner-name { font-size: 12px; font-weight: 700; color: rgba(20,20,20,0.7); }

      .kp-row {
        display: grid;
        grid-template-columns: 116px 1fr 64px 92px 92px;
        gap: 12px;
        align-items: center;
      }
      .kp-row-head {
        margin-top: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid;
        font-size: 8.5px; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase;
      }
      .kp-row-item {
        padding: 10px 0;
        border-bottom: 1px solid rgba(20, 20, 20, 0.06);
        break-inside: avoid;
      }
      .kp-center { text-align: center; }
      .kp-right { text-align: right; }

      .kp-thumb {
        width: 116px; height: 78px;
        border-radius: 6px; overflow: hidden;
        background: rgba(20, 20, 20, 0.03);
        display: flex; align-items: center; justify-content: center;
      }
      .kp-thumb img { width: 100%; height: 100%; object-fit: contain; }

      .kp-item-name {
        font-size: 11.5px; font-weight: 700; line-height: 1.3;
        overflow-wrap: anywhere;
      }
      .kp-item-desc {
        font-size: 9.5px; color: rgba(20,20,20,0.6);
        margin-top: 4px; white-space: pre-line; line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .kp-item-dims { font-size: 9.5px; color: rgba(20,20,20,0.45); margin-top: 4px; }
      .kp-item-qty { font-size: 11px; font-weight: 600; }
      .kp-unit { display: block; font-size: 8.5px; font-weight: 400; color: rgba(20,20,20,0.45); }
      .kp-item-price { font-size: 11px; color: rgba(20,20,20,0.7); }
      .kp-item-total { font-size: 12.5px; font-weight: 700; }

      .kp-outro { margin-top: 18px; break-inside: avoid; }
      .kp-summary {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 14px; align-items: stretch;
      }
      .kp-deadline {
        background: rgba(20, 20, 20, 0.025);
        border: 1px solid rgba(20, 20, 20, 0.06);
        border-radius: 8px; padding: 14px 16px;
        display: flex; flex-direction: column; justify-content: center;
      }
      .kp-deadline-value {
        font-family: var(--font-heading, Georgia), serif;
        font-size: 22px; font-weight: 700; margin-top: 6px;
      }
      .kp-total-card {
        background: #16130f; color: #fff;
        border-radius: 8px; padding: 14px 16px;
      }
      .kp-total-sub {
        display: flex; justify-content: space-between;
        font-size: 10px; color: rgba(255,255,255,0.6);
        padding-bottom: 9px; border-bottom: 1px solid rgba(255,255,255,0.12);
      }
      .kp-total-main {
        display: flex; justify-content: space-between; align-items: center;
        gap: 10px; margin-top: 10px;
        font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
        text-transform: uppercase; color: rgba(255,255,255,0.75);
      }
      .kp-total-value {
        font-family: var(--font-heading, Georgia), serif;
        font-size: 19px; font-weight: 700; letter-spacing: -0.01em;
        padding: 5px 12px; border-radius: 6px;
        white-space: nowrap;
      }
      .kp-total-note {
        margin-top: 9px; text-align: right;
        font-size: 8.5px; font-style: italic; color: rgba(255,255,255,0.45);
      }

      .kp-final-text {
        margin-top: 14px; font-size: 10.5px; line-height: 1.6;
        color: rgba(20,20,20,0.7);
      }

      .kp-signatures {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 40px; margin-top: 20px;
      }
      .kp-sign-closing { font-size: 10px; color: rgba(20,20,20,0.6); }
      .kp-sign-line {
        margin-top: 20px; border-top: 1px solid rgba(20, 20, 20, 0.35);
      }
      .kp-sign-role { margin-top: 5px; font-size: 9px; color: rgba(20,20,20,0.5); }

      .kp-footer {
        display: flex; justify-content: space-between; align-items: flex-end;
        gap: 16px; margin-top: 20px; padding-top: 12px;
        border-top: 1px solid rgba(20, 20, 20, 0.08);
      }
      .kp-footer-name { font-size: 10.5px; font-weight: 700; }
      .kp-footer-line { font-size: 9px; color: rgba(20,20,20,0.5); margin-top: 2px; }
      .kp-footer-right { text-align: right; }
      .kp-footer-page { font-size: 9px; font-weight: 700; margin-top: 3px; }

      @media print {
        @page { size: A4; margin: 0; }
        html, body { background: #fff !important; }
        body * { visibility: hidden; }
        .kp-doc, .kp-doc * { visibility: visible; }
        .kp-doc {
          position: absolute; left: 0; top: 0; width: 100%;
        }
        .kp-page {
          margin: 0;
          box-shadow: none;
          break-after: page;
          page-break-after: always;
        }
        .kp-page:last-child { break-after: auto; page-break-after: auto; }
      }
    `}</style>
  );
}
