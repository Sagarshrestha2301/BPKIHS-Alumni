from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

BASE = Path(r"C:\dev\bpkihs-alumni\artifacts\user-manual")
ASSETS = BASE / "assets"
OUT = BASE / "BPKIHS Alumni Association User Manual.docx"

NAVY = "12355B"
BLUE = "1F5A95"
ORANGE = "BE5A28"
PALE_BLUE = "EAF2F8"
PALE_GRAY = "F5F7F9"
GRAY_BORDER = "D9D9D9"
TEXT = "252A30"
MUTED = "5A6570"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color=GRAY_BORDER):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "6")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    flag = OxmlElement("w:tblHeader")
    flag.set(qn("w:val"), "true")
    tr_pr.append(flag)


def set_font(run, name="Aptos", size=None, bold=None, color=None, italic=None):
    run.font.name = name
    rpr = run._element.get_or_add_rPr()
    fonts = rpr.rFonts
    if fonts is None:
        fonts = OxmlElement("w:rFonts")
        rpr.append(fonts)
    for attr in ("ascii", "hAnsi", "eastAsia"):
        fonts.set(qn(f"w:{attr}"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)
    if italic is not None:
        run.italic = italic


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)
    set_font(run, size=9, color=MUTED)


def add_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(0)
    text = p.add_run("BPKIHS Alumni Association | User Manual | Page ")
    set_font(text, size=9, color=MUTED)
    add_page_number(p)


def add_header(section):
    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("BPKIHS Alumni Association")
    set_font(r, size=9, bold=True, color=NAVY)


def setup_styles(doc):
    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(TEXT)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.15

    title = doc.styles["Title"]
    title.font.name = "Aptos Display"
    title.font.size = Pt(29)
    title.font.bold = True
    title.font.color.rgb = RGBColor(0, 0, 0)
    title.paragraph_format.space_after = Pt(10)

    for name, size in (("Heading 1", 19), ("Heading 2", 14), ("Heading 3", 11.5)):
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.space_before = Pt(14 if name == "Heading 1" else 10)
        style.paragraph_format.space_after = Pt(6)
        style.paragraph_format.keep_with_next = True

    if "Caption" not in [s.name for s in doc.styles]:
        caption = doc.styles.add_style("Caption", WD_STYLE_TYPE.PARAGRAPH)
    else:
        caption = doc.styles["Caption"]
    caption.font.name = "Aptos"
    caption.font.size = Pt(9)
    caption.font.italic = True
    caption.font.color.rgb = RGBColor.from_string(MUTED)
    caption.paragraph_format.space_before = Pt(3)
    caption.paragraph_format.space_after = Pt(10)

    if "Code" not in [s.name for s in doc.styles]:
        code = doc.styles.add_style("Code", WD_STYLE_TYPE.PARAGRAPH)
    else:
        code = doc.styles["Code"]
    code.font.name = "Consolas"
    code.font.size = Pt(8.5)
    code.font.color.rgb = RGBColor.from_string(TEXT)
    code.paragraph_format.left_indent = Inches(0.18)
    code.paragraph_format.right_indent = Inches(0.18)
    code.paragraph_format.space_before = Pt(5)
    code.paragraph_format.space_after = Pt(8)
    code.paragraph_format.line_spacing = 1.08


def add_title(doc, title, subtitle=None):
    p = doc.add_paragraph(style="Title")
    p.add_run(title)
    if subtitle:
        sub = doc.add_paragraph()
        sub.paragraph_format.space_after = Pt(14)
        r = sub.add_run(subtitle)
        set_font(r, size=13, color=MUTED)


def add_para(doc, text, lead=None):
    p = doc.add_paragraph()
    if lead:
        r = p.add_run(lead)
        set_font(r, bold=True, color=NAVY)
    r = p.add_run(text)
    set_font(r)
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(item)
        set_font(r)


def add_steps(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(item)
        set_font(r)


def add_code(doc, text):
    p = doc.add_paragraph(style="Code")
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(7)
    ppr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), PALE_GRAY)
    ppr.append(shd)
    for line_number, line in enumerate(text.splitlines()):
        if line_number:
            p.add_run().add_break()
        r = p.add_run(line)
        set_font(r, name="Consolas", size=8.5)
    return p


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for index, header in enumerate(headers):
        cell = hdr.cells[index]
        cell.text = ""
        set_cell_shading(cell, NAVY)
        set_cell_border(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(header)
        set_font(r, size=9, bold=True, color="FFFFFF")
        if widths:
            cell.width = Inches(widths[index])
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for index, value in enumerate(row):
            cell = cells[index]
            cell.text = ""
            set_cell_shading(cell, "FFFFFF" if row_index % 2 == 0 else PALE_BLUE)
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(value)
            set_font(r, size=9)
            if widths:
                cell.width = Inches(widths[index])
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_figure(doc, filename, caption, width=6.45):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(0)
    p.add_run().add_picture(str(ASSETS / filename), width=Inches(width))
    cap = doc.add_paragraph(style="Caption")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.add_run(caption)


def page_break(doc):
    doc.add_page_break()


def build():
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.72)
    sec.bottom_margin = Inches(0.65)
    sec.left_margin = Inches(0.78)
    sec.right_margin = Inches(0.78)
    setup_styles(doc)
    add_header(sec)
    add_footer(sec)

    # Cover
    doc.add_paragraph().paragraph_format.space_after = Pt(40)
    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.add_run("BPKIHS Alumni Association\nUser Manual")
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.paragraph_format.space_after = Pt(24)
    r = sub.add_run("Website use, administration, local running, payments, and database checks")
    set_font(r, size=13, color=MUTED)
    logo = doc.add_paragraph()
    logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    logo.add_run().add_picture(str(Path(r"C:\dev\bpkihs-alumni\public\bp-koirala_logo.png")), width=Inches(1.05))
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    intro = doc.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    intro.paragraph_format.left_indent = Inches(0.8)
    intro.paragraph_format.right_indent = Inches(0.8)
    rr = intro.add_run(
        "A practical guide for alumni, staff, and local operators. Use the website for normal content work; use the database only for approved checks, maintenance, and recovery."
    )
    set_font(rr, size=12, color=TEXT)
    doc.add_paragraph().paragraph_format.space_after = Pt(35)
    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = meta.add_run("Prepared for the BPKIHS Alumni Association | 31 October 2026")
    set_font(r, size=10, color=MUTED)
    page_break(doc)

    # Contents and rules
    add_title(doc, "Using this manual", "Start with the section that matches your role.")
    add_para(doc, "The public website helps BPKIHS graduates reconnect, find alumni, attend events, share news, and support current goals. Staff use the administration area for reviewed content. Technical operators run the local service and inspect the database with read-only queries.")
    doc.add_heading("Contents", level=1)
    contents = [
        ("1", "Website overview", "Public navigation and member journeys"),
        ("2", "Member account and community", "Registration, sign in, profiles, posts, and events"),
        ("3", "Giving and payments", "Donation flow, receipts, sandbox, and gateway troubleshooting"),
        ("4", "Administration", "Content, moderation, donations, and support work"),
        ("5", "Run the website locally", "Database, migrations, environment, development server, and checks"),
        ("6", "Database checks", "Studio, psql, read-only inspection, backups, and safe recovery boundaries"),
    ]
    add_table(doc, ["Part", "Section", "Use it for"], contents, [0.48, 2.35, 3.7])
    doc.add_heading("Roles and safe boundaries", level=1)
    add_table(
        doc,
        ["Role", "Normal tools", "Do not do"],
        [
            ("Visitor or alumnus", "Website pages, account, directory, events, community, donate", "Share another person's contact details or credentials"),
            ("Content staff", "Admin content, posts, approvals, event and goal editing", "Edit tables directly when an admin screen supports the task"),
            ("Technical operator", "Terminal, migrations, health checks, database read-only queries, backups", "Mark donations paid by hand or put secrets in source control"),
        ],
        [1.15, 2.72, 2.66],
    )
    add_para(doc, "Keep payment keys, database passwords, backup encryption keys, and exported personal data out of chat, screenshots, and source control.", lead="Important. ")
    page_break(doc)

    # Home
    add_title(doc, "1 Website overview", "The public site is designed to make the most common alumni tasks easy to find.")
    add_figure(doc, "home-page.png", "Figure 1. Home page on a mobile-sized display. The main actions are Donate, Find alumni, and Join the network.", width=4.85)
    doc.add_heading("Start from the home page", level=1)
    add_steps(doc, [
        "Open the site at the published address, or http://localhost:3000 while running locally.",
        "Use the main navigation for About, Directory, Events, Community, and Support.",
        "Use Donate for a general or goal-specific gift. Use Register to join as an alumnus.",
        "On a phone, open the menu button to reach the same main sections.",
    ])
    page_break(doc)
    doc.add_heading("Public page map", level=1)
    add_table(
        doc,
        ["Page", "What a visitor can do"],
        [
            ("About", "Read the Association purpose, work, board information, and relationship with BPKIHS."),
            ("Directory", "Search and filter approved alumni records. Visibility follows each member's privacy settings."),
            ("Events", "See upcoming and past events, open event details, and RSVP when an event accepts responses."),
            ("Community", "Read approved alumni stories, notices, achievements, and Association updates."),
            ("Support", "Read FAQs, contact the Association, and use the helpdesk where available."),
            ("Donate", "Review goals, progress, transparency information, and start a donation."),
        ],
        [1.35, 5.18],
    )
    doc.add_heading("Finding what you need", level=1)
    add_bullets(doc, [
        "Use the site header to move between public areas without returning to the home page.",
        "Use the footer for Support, FAQ, legal pages, newsletter options, and Institute links.",
        "Open a goal, event, post, or directory profile from its card to see the detail page and related action.",
        "Use the browser address bar to share a public page. Do not share a signed-in account, admin, or payment-callback URL.",
    ])
    page_break(doc)

    # About and community
    add_title(doc, "2 About and community pages", "Use About for institutional information and Community for alumni news.")
    add_figure(doc, "about-page-manual.png", "Figure 2. About page with the Association purpose, intended network, work areas, and institute connection.", width=5.85)
    doc.add_heading("About", level=1)
    add_bullets(doc, [
        "Open About to explain why the Association exists and how it works with BPKIHS.",
        "Use Meet the board to see the current leadership and available biographies.",
        "Use How we work with BPKIHS for governance and funds-handling information.",
    ])
    page_break(doc)
    add_title(doc, "Community, directory, and events", "Read approved updates, find classmates, and RSVP for gatherings.")
    add_figure(doc, "community-page-manual.png", "Figure 3. Community page. Visitors can read approved updates; signed-in alumni can use the sharing flow when it is enabled.", width=5.85)
    add_bullets(doc, [
        "Community posts are moderated. Submitted content is not public until approved.",
        "The directory exposes only fields the alumnus has allowed for the viewer's role.",
        "For an event, open the detail page to check date, venue, mode, capacity, and RSVP availability.",
    ])
    page_break(doc)

    # account
    add_title(doc, "3 Member account and profile", "Members use one account for their profile, privacy choices, and alumni participation.")
    add_figure(doc, "member-account-manual.png", "Figure 4. Signed-in member account page. Fields and options vary by the member's current profile and approval status.", width=5.85)
    doc.add_heading("Register and sign in", level=1)
    add_steps(doc, [
        "Select Register from the top navigation and complete the membership registration flow.",
        "Use the verification message or code when prompted. A submitted alumni profile may need staff approval before it appears in the directory.",
        "Use Sign in to return to the account. Use the forgotten-password flow if a password is unavailable.",
        "Open Account to review identity, update profile information, and manage settings that are available to the signed-in role.",
    ])
    doc.add_heading("Privacy and profile checks", level=1)
    add_bullets(doc, [
        "Choose profile, email, and phone visibility carefully. A public directory record should never expose information that the member has not selected for viewing.",
        "Before publishing a new profile photo, confirm the alumnus has consented and that the image is appropriate for an alumni directory.",
        "Staff should review a registration before approval, especially imported or incomplete records.",
    ])
    page_break(doc)

    # donations
    add_title(doc, "4 Giving and payments", "The site records a gift only after a payment gateway confirms it.")
    add_figure(doc, "donate-page-manual.png", "Figure 5. Donate page with goal cards, progress, and supporting information. Content reflects the current database.", width=5.0)
    doc.add_heading("Make a donation", level=1)
    add_steps(doc, [
        "Open Donate and choose a goal, a quick amount, or the general-fund option.",
        "Sign in if prompted. The site creates a pending donation before redirecting to the selected payment gateway.",
        "Review the gateway amount and merchant information, then complete or cancel the transaction at the gateway.",
        "After a verified callback, the site records a succeeded donation, updates the goal total, and sends or logs a receipt according to the email configuration.",
    ])
    doc.add_heading("Payment controls", level=1)
    add_bullets(doc, [
        "A browser return alone is not proof of payment. The server verifies the gateway response before marking a donation as succeeded.",
        "Do not set donations.status to succeeded directly in SQL. It bypasses the payment event, goal-total, and receipt flow.",
        "For sandbox testing, use test credentials only in the gateway's test environment. Do not place merchant secrets in this manual or in source code.",
        "If a donor cancels or closes the gateway, the pending donation is not a completed gift.",
    ])
    page_break(doc)

    # Admin
    add_title(doc, "5 Administration", "Staff members with the admin role can manage approved content and operational queues.")
    add_figure(doc, "admin-dashboard-manual.png", "Figure 6. Admin dashboard in a local fixture environment. Production counts and menu items reflect the live data and staff permissions.", width=5.0)
    doc.add_heading("Routine staff work", level=1)
    add_table(
        doc,
        ["Area", "Typical task", "Check before saving"],
        [
            ("Content", "Add or update events, giving goals, goal updates, board records, FAQs, and welcome text.", "Dates, public wording, links, image rights, and publish state."),
            ("Posts", "Review a pending community post, then approve or reject it.", "Accuracy, respectful language, consent, and image suitability."),
            ("Alumni", "Review registrations, imports, and requests that affect directory visibility.", "Identity, programme/batch data, profile privacy, and photo consent."),
            ("Donations", "Review the ledger, goal totals, and gateway callback records.", "Gateway status and payment event; never manufacture a paid result."),
            ("Support", "Review tickets and follow up using the reference number.", "Avoid putting personal data into public replies."),
        ],
        [1.05, 3.0, 2.48],
    )
    doc.add_heading("Admin review checklist", level=1)
    add_bullets(doc, [
        "Use the admin screen rather than a direct database edit whenever that screen supports the action.",
        "Confirm public text, dates, and external links before publish.",
        "Do not paste payment secrets, password-reset tokens, or full donor exports into content fields or support replies.",
        "Record the reason for a rejection when it will help the submitter correct the issue.",
    ])

    # local run
    add_title(doc, "6 Run the website locally", "A development environment uses Next.js, PostgreSQL, and the environment variables in .env.local.")
    doc.add_heading("First-time setup", level=1)
    add_steps(doc, [
        "Install the project dependencies from the repository root.",
        "Copy .env.example to .env.local and set required values. Keep .env.local out of version control.",
        "Start Docker Desktop, then start PostgreSQL and apply the migrations.",
        "Create an administrator if this is a new development database.",
        "Start the development server and browse to http://localhost:3000.",
    ])
    add_code(doc, "npm install\nCopy-Item .env.example .env.local\nnpm run db:up\nnpm run db:migrate\nnpm run db:admin\nnpm run dev")
    doc.add_heading("Daily run and quality checks", level=1)
    add_table(
        doc,
        ["Command", "Use it for"],
        [
            ("npm run dev", "Start Next.js locally after environment and database are ready."),
            ("npm run check:env", "Report missing or unsafe environment configuration before a release."),
            ("npm run typecheck", "Validate TypeScript and Next route types."),
            ("npm run lint", "Run the repository lint rules."),
            ("npm run test", "Run the unit-test suite."),
            ("npm run test:e2e", "Run browser workflows against fixture data."),
            ("npm run check:health", "Check the running application health endpoint."),
        ],
        [2.1, 4.43],
    )
    add_para(doc, "Restart npm run dev after changing server-side environment values. The local site must use the same APP_URL and port expected by its authentication and callback configuration.", lead="Tip. ")

    # db inspection
    add_title(doc, "7 Check the database safely", "Use the database to inspect state and reconcile operations. Prefer read-only queries first.")
    doc.add_heading("Open the database", level=1)
    add_bullets(doc, [
        "Use npm run db:studio for a local browser-based view of the schema and rows.",
        "Use psql in the database container for controlled SQL checks.",
        "The local database service is named bpkihs-postgres and is exposed on localhost port 5433 by default.",
    ])
    add_code(doc, "npm run db:studio\n\ndocker exec -it bpkihs-postgres psql -U bpkihs -d bpkihs")
    doc.add_heading("Read-only queries you will use", level=1)
    add_para(doc, "Run these in psql to inspect operational state. They do not modify rows.")
    add_code(doc, "-- Pending alumni registrations\nselect id, full_name, email, batch_year, programme, created_at\nfrom alumni\nwhere status = 'pending' and source = 'self_registered'\norder by created_at desc\nlimit 20;\n\n-- Recent payment state\nselect id, amount_minor, method, status, gateway, gateway_ref, created_at\nfrom donations\norder by created_at desc\nlimit 20;\n\n-- A donation and its callback events\nselect d.id, d.status, d.gateway_ref, p.event_type, p.created_at\nfrom donations d\nleft join payment_events p on p.donation_id = d.id\nwhere d.id = '<donation id>';\n\n-- Current goal totals\nselect title, target_minor, raised_minor, active\nfrom donation_goals\norder by sort_order;")
    doc.add_heading("Reading money values", level=1)
    add_para(doc, "Money columns ending in _minor store paisa as whole numbers. NPR 5,000.00 is stored as 500000. Convert before reporting an amount to a person.", lead="Remember. ")
    page_break(doc)

    # Maintenance and backup
    add_title(doc, "8 Database maintenance and backups", "Direct writes are a repair tool, not the normal way to operate the site.")
    doc.add_heading("Safe order of operations", level=1)
    add_steps(doc, [
        "Use the website's admin screen if it can perform the action.",
        "If a direct database repair is necessary, take a fresh backup first and write down the exact target row and intended result.",
        "Start with a SELECT query that proves the target. Do not use broad updates, wildcards, or a missing WHERE clause.",
        "After a change, re-run the relevant read-only check and record what was changed and why.",
    ])
    doc.add_heading("Backups", level=1)
    add_code(doc, "npm run db:backup\n# Optional custom backup location\nBACKUP_DIR=/var/backups/bpkihs ./scripts/backup-db.sh")
    add_bullets(doc, [
        "The backup script writes a compressed SQL dump and keeps the configured retention period.",
        "Store production backups away from the application server and encrypt them at rest.",
        "Practice a restore into a separate scratch database before relying on a backup process.",
        "A reset command such as docker compose down -v destroys the local database volume. Treat it as destructive.",
    ])
    doc.add_heading("Never do these things", level=1)
    add_bullets(doc, [
        "Never manually mark a donation succeeded. Only the verified gateway callback completes a gift.",
        "Never edit a migration that has already been applied. Create a new forward-only migration.",
        "Never copy donor emails, payment payloads, or entire exports into public documents or issue trackers.",
        "Never put database passwords, encryption keys, or gateway keys in the repository.",
    ])
    page_break(doc)

    # payments
    add_title(doc, "9 Payment operations and troubleshooting", "Gateway configuration determines whether a payment method is offered at checkout.")
    doc.add_heading("Sandbox test flow", level=1)
    add_steps(doc, [
        "Set PAYMENT_MODE=sandbox and provide only sandbox gateway configuration in .env.local.",
        "Restart the development server, sign in as a test user, choose a goal and an amount, then select a configured gateway.",
        "Complete the test entirely at the gateway. The website must receive and verify the callback before it records success.",
        "Check the newest donation, the payment_events table, the goal total, and the receipt log or email result.",
    ])
    doc.add_heading("When eSewa shows an unavailable service message", level=1)
    add_para(doc, "The eSewa sandbox can return an upstream availability or timeout message even when the request reaches its form correctly. Confirm that the application is using sandbox mode and the test merchant configuration, then retry later or with another permitted test account. Do not switch to production keys or URLs to solve a sandbox outage.")
    doc.add_heading("Quick diagnosis", level=1)
    add_table(
        doc,
        ["Symptom", "First check"],
        [
            ("Payments are not configured", "PAYMENT_MODE is sandbox or live, and at least one gateway has its required variables."),
            ("eSewa is not configured", "ESEWA_PRODUCT_CODE and ESEWA_SECRET_KEY are set only in the server environment."),
            ("Callback never arrives", "APP_URL is a reachable public HTTPS origin in production and the correct callback URL is registered with the gateway."),
            ("Donation stays pending", "The user abandoned the gateway or a verified callback has not arrived. Inspect callback events before acting."),
            ("No receipt", "Check email transport configuration and server logs; a receipt failure must not change a verified donation result."),
        ],
        [2.0, 4.53],
    )
    page_break(doc)

    # release
    add_title(doc, "10 Release and support checklist", "Use this checklist before publishing a code or content change.")
    doc.add_heading("Before deployment", level=1)
    add_bullets(doc, [
        "Run npm run check:env and resolve all production blockers.",
        "Run npm run typecheck, npm run lint, and npm run test. Use end-to-end tests for high-risk flows such as authentication, donations, and moderation.",
        "Take a database backup before a migration or material configuration change.",
        "Apply production migrations with npm run db:migrate:prod, not by editing live tables manually.",
        "Confirm APP_URL, contact details, email configuration, and gateway return URLs match the real public domain.",
    ])
    doc.add_heading("After deployment", level=1)
    add_bullets(doc, [
        "Run npm run check:health and open the home page, directory, events, community, and donate pages in a browser.",
        "Submit one harmless support or newsletter test only if the environment is designed for it; avoid sending test mail to the real audience.",
        "For payment releases, perform a small authorised end-to-end gateway payment and reconcile it with the gateway dashboard and the donation ledger.",
        "Watch server logs for callback, email, and authentication errors after the release.",
    ])
    doc.add_heading("Where to find more detail", level=1)
    add_para(doc, "Use docs/DB-AND-PAYMENTS.md for gateway and database procedures; docs/HOWTO.md for daily administration; docs/DEPLOYMENT.md for releases; docs/SECURITY.md for controls; and docs/BACKEND.md for architecture.")
    doc.add_heading("Quick reference", level=1)
    add_code(doc, "Start database:      npm run db:up\nApply migrations:    npm run db:migrate\nStart website:       npm run dev\nCheck environment:   npm run check:env\nRun tests:           npm run test\nBrowse database:     npm run db:studio\nCreate backup:       npm run db:backup\nCheck health:        npm run check:health")

    props = doc.core_properties
    props.title = "BPKIHS Alumni Association User Manual"
    props.subject = "Website operation, administration, local running, payments, and database checks"
    props.author = "BPKIHS Alumni Association"
    props.keywords = "BPKIHS, alumni, user manual, operations, database, payments"
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
