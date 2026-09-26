/**
 * Value Object: PdfPermissions
 * ISO 32000-1:2008 Clause 7.6.3.2 Table 22 (User Access Permissions)
 * Represents immutable 32-bit permission flags (/P)
 */

export interface IPdfPermissionFlags {
  canPrint?: boolean;             // Bit 3
  canModify?: boolean;            // Bit 4
  canCopy?: boolean;              // Bit 5
  canAnnotate?: boolean;          // Bit 6
  canFillForms?: boolean;         // Bit 9
  canAccessText?: boolean;        // Bit 10 (Accessibility)
  canAssemble?: boolean;          // Bit 11
  canPrintHighQuality?: boolean;  // Bit 12
}

export class PdfPermissions {
  public readonly canPrint: boolean;
  public readonly canModify: boolean;
  public readonly canCopy: boolean;
  public readonly canAnnotate: boolean;
  public readonly canFillForms: boolean;
  public readonly canAccessText: boolean;
  public readonly canAssemble: boolean;
  public readonly canPrintHighQuality: boolean;

  constructor(flags: IPdfPermissionFlags = {}) {
    this.canPrint = flags.canPrint ?? true;
    this.canModify = flags.canModify ?? false;
    this.canCopy = flags.canCopy ?? false;
    this.canAnnotate = flags.canAnnotate ?? false;
    this.canFillForms = flags.canFillForms ?? false;
    this.canAccessText = flags.canAccessText ?? true;
    this.canAssemble = flags.canAssemble ?? false;
    this.canPrintHighQuality = flags.canPrintHighQuality ?? false;

    // Invariant: High-quality printing requires basic printing permission
    if (this.canPrintHighQuality && !this.canPrint) {
      this.canPrint = true;
    }

    Object.freeze(this);
  }

  /**
   * Calculates signed 32-bit integer for PDF /P entry adhering to ISO 32000-1.
   * Bits 7-8 and 13-32 are reserved and MUST be set to 1.
   */
  public toBitmask(): number {
    // Start with all bits set to 1
    let mask = 0xffffffff;

    // Bit 3 (0-based: bit 2): print
    if (!this.canPrint) mask &= ~(1 << 2);

    // Bit 4 (0-based: bit 3): modify contents
    if (!this.canModify) mask &= ~(1 << 3);

    // Bit 5 (0-based: bit 4): copy / extract text & graphics
    if (!this.canCopy) mask &= ~(1 << 4);

    // Bit 6 (0-based: bit 5): add/modify annotations & interactive form fields
    if (!this.canAnnotate) mask &= ~(1 << 5);

    // Bit 9 (0-based: bit 8): fill in interactive form fields
    if (!this.canFillForms) mask &= ~(1 << 8);

    // Bit 10 (0-based: bit 9): extract text & graphics for accessibility
    if (!this.canAccessText) mask &= ~(1 << 9);

    // Bit 11 (0-based: bit 10): assemble document
    if (!this.canAssemble) mask &= ~(1 << 10);

    // Bit 12 (0-based: bit 11): high-quality print
    if (!this.canPrintHighQuality) mask &= ~(1 << 11);

    // Ensure signed 32-bit integer representation
    return mask | 0;
  }

  /**
   * Factory: Full permissions allowed (Open Public)
   */
  public static createAllAllowed(): PdfPermissions {
    return new PdfPermissions({
      canPrint: true,
      canModify: true,
      canCopy: true,
      canAnnotate: true,
      canFillForms: true,
      canAccessText: true,
      canAssemble: true,
      canPrintHighQuality: true,
    });
  }

  /**
   * Factory: Strict Read-Only (Print allowed, modification/copying forbidden)
   */
  public static createStrictReadOnly(): PdfPermissions {
    return new PdfPermissions({
      canPrint: true,
      canModify: false,
      canCopy: false,
      canAnnotate: false,
      canFillForms: false,
      canAccessText: true,
      canAssemble: false,
      canPrintHighQuality: false,
    });
  }

  /**
   * Factory: DRM strict lock (All permissions disabled)
   */
  public static createNoPermissions(): PdfPermissions {
    return new PdfPermissions({
      canPrint: false,
      canModify: false,
      canCopy: false,
      canAnnotate: false,
      canFillForms: false,
      canAccessText: false,
      canAssemble: false,
      canPrintHighQuality: false,
    });
  }

  /**
   * Factory from existing 32-bit mask
   */
  public static fromBitmask(mask: number): PdfPermissions {
    return new PdfPermissions({
      canPrint: (mask & (1 << 2)) !== 0,
      canModify: (mask & (1 << 3)) !== 0,
      canCopy: (mask & (1 << 4)) !== 0,
      canAnnotate: (mask & (1 << 5)) !== 0,
      canFillForms: (mask & (1 << 8)) !== 0,
      canAccessText: (mask & (1 << 9)) !== 0,
      canAssemble: (mask & (1 << 10)) !== 0,
      canPrintHighQuality: (mask & (1 << 11)) !== 0,
    });
  }
}
