type FashionIllustrationProps = {
  variant: 'brands' | 'collection' | 'generator' | 'profile' | 'today' | 'wardrobe';
};

type MiniIllustrationProps = {
  variant: 'assistant' | 'brands' | 'closet' | 'empty' | 'look' | 'palette' | 'photo' | 'save' | 'score' | 'shop' | 'weather' | 'week';
};

export function FashionIllustration({ variant }: FashionIllustrationProps) {
  return (
    <div className={`fashion-illustration ${variant}`} aria-hidden="true">
      <svg viewBox="0 0 420 300" role="img">
        <defs>
          <pattern id="tweed" width="28" height="20" patternUnits="userSpaceOnUse">
            <rect className="ill-tweed-base" width="28" height="20" />
            <path className="ill-tweed-thread light" d="M0 18L14 0M14 0l14 18M-7 18L7 0M21 0l14 18" />
            <path className="ill-tweed-thread gold" d="M0 10h28M7 0v20M21 0v20" />
          </pattern>
          <pattern id="quilt" width="18" height="18" patternUnits="userSpaceOnUse">
            <path className="ill-quilt-line" d="M0 18L18 0M-9 9L9-9M9 27L27 9" />
          </pattern>
          <pattern id="today-couture" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
            <rect className="ill-today-base" width="34" height="34" />
            <path className="ill-today-thread cream" d="M4 0v34M18 0v34M32 0v34" />
            <path className="ill-today-thread gold" d="M11 0v34M25 0v34" />
          </pattern>
        </defs>
        <rect className="ill-frame" x="18" y="20" width="384" height="250" rx="8" />

        {variant === 'today' && (
          <g>
            <circle className="ill-sun" cx="86" cy="76" r="28" />
            <path className="ill-cloud" d="M128 96c9-18 42-16 48 7 18 1 31 14 31 31 0 20-16 32-40 32H94c-26 0-42-14-42-34 0-22 19-36 44-31 8-7 18-10 32-5z" />
            <path className="ill-coat ill-today-couture" d="M256 86c10-8 46-8 56 0l14 24-10 8-8-12 3 42h-54l3-42-8 12-10-8 14-24z" />
            <path className="ill-line ill-seam" d="M270 88l14 24 14-24M284 112v34M263 128c13 6 29 6 42 0" />
            <path className="ill-waist" d="M256 150h56" />
            <path className="ill-pants ill-tailored-pants" d="M256 162h56l12 48h-28l-12-30-12 30h-28l12-48z" />
            <path className="ill-line ill-seam" d="M284 164v44M263 184h42" />
            <path className="ill-trim" d="M246 210h26M296 210h26" />
            <g className="ill-necklace" aria-hidden="true">
              <circle cx="263" cy="91" r="4.5" />
              <circle cx="272" cy="101" r="4.5" />
              <circle cx="284" cy="108" r="5" />
              <circle cx="296" cy="101" r="4.5" />
              <circle cx="305" cy="91" r="4.5" />
            </g>
            <circle className="ill-button" cx="284" cy="144" r="5" />
            <circle className="ill-button" cx="284" cy="164" r="5" />
            <path className="ill-bag ill-quilted" d="M315 178h48l8 54h-64l8-54z" />
            <path className="ill-line" d="M324 178c0-18 38-18 38 0" />
          </g>
        )}

        {variant === 'generator' && (
          <g>
            <path className="ill-line" d="M72 82h260M96 82v148M308 82v148M74 230h258" />
            <path className="ill-line accent" d="M154 52v30l-46 38h92l-46-38" />
            <path className="ill-coat ill-tweed" d="M112 120c12-10 72-10 84 0l18 31-13 10-8-16 4 32H111l4-32-8 16-13-10 18-31z" />
            <path className="ill-line ill-seam" d="M130 122l24 38 24-38M154 160v16M122 168c20 9 44 9 64 0" />
            <path className="ill-trim" d="M116 126h76M112 177h84" />
            <circle className="ill-button" cx="154" cy="144" r="5" />
            <circle className="ill-button" cx="154" cy="164" r="5" />
            <path className="ill-shirt ill-cream" d="M239 106c10-8 60-8 70 0l13 28-11 8-7-14 4 26 8 18h-86l8-18 4-26-7 14-11-8 15-28z" />
            <path className="ill-pants" d="M248 180h58l14 54h-30l-12-32-12 32h-32l14-54z" />
            <g className="ill-necklace" aria-hidden="true">
              <circle cx="240" cy="90" r="4" />
              <circle cx="251" cy="98" r="4.2" />
              <circle cx="264" cy="102" r="4.5" />
              <circle cx="277" cy="103" r="4.7" />
              <circle cx="290" cy="102" r="4.5" />
              <circle cx="303" cy="98" r="4.2" />
              <circle cx="314" cy="90" r="4" />
            </g>
            <path className="ill-spark" d="M344 48l6 13 14 5-14 5-6 13-6-13-14-5 14-5 6-13z" />
          </g>
        )}

        {variant === 'wardrobe' && (
          <g>
            <rect className="ill-panel" x="62" y="50" width="122" height="182" rx="8" />
            <path className="ill-line" d="M86 76h74M86 76v132M160 76v132M86 208h74" />
            <path className="ill-line accent" d="M123 76v132" />
            <path className="ill-shirt ill-cream" d="M219 72c10-8 58-8 68 0l13 28-11 8-7-14 4 29 7 19h-84l7-19 4-29-7 14-11-8 17-28z" />
            <path className="ill-line ill-seam" d="M238 72l16 22 16-22M224 116c16 8 42 8 58 0" />
            <path className="ill-coat ill-tweed" d="M248 150c11-9 65-9 76 0l19 27-12 9-8-15 4 25h-84l4-25-8 15-12-9 21-27z" />
            <path className="ill-trim" d="M250 156h72M244 196h82" />
            <path className="ill-pants" d="M256 202h54l12 34h-24l-10-22-10 22h-24l12-34z" />
            <circle className="ill-button" cx="284" cy="176" r="5" />
            <circle className="ill-button" cx="284" cy="196" r="5" />
            <g className="ill-necklace" aria-hidden="true">
              <circle cx="222" cy="142" r="4" />
              <circle cx="236" cy="151" r="4.2" />
              <circle cx="252" cy="156" r="4.5" />
              <circle cx="270" cy="158" r="4.8" />
              <circle cx="288" cy="156" r="4.5" />
              <circle cx="306" cy="151" r="4.2" />
              <circle cx="322" cy="142" r="4" />
            </g>
            <path className="ill-shoe" d="M82 232c18-8 42-8 58 0 6 3 4 12-4 12H84c-9 0-11-9-2-12z" />
            <path className="ill-shoe" d="M256 232c18-8 42-8 58 0 6 3 4 12-4 12h-52c-9 0-11-9-2-12z" />
          </g>
        )}

        {variant === 'brands' && (
          <g>
            <rect className="ill-card-a" x="54" y="48" width="150" height="184" rx="8" />
            <path className="ill-line accent" d="M128 58v22M96 80h64" />
            <path className="ill-coat ill-tweed" d="M94 92c10-9 58-9 68 0l18 31-12 9-8-15 4 42H92l4-42-8 15-12-9 18-31z" />
            <path className="ill-trim" d="M98 98h60M92 159h72" />
            <path className="ill-line ill-seam" d="M111 92l17 31 17-31M128 123v35M100 151c17 8 39 8 56 0" />
            <path className="ill-pants" d="M100 164h56l12 34h-24l-10-22-10 22h-24l12-34z" />
            <circle className="ill-button" cx="128" cy="142" r="5" />
            <circle className="ill-button" cx="128" cy="162" r="5" />
            <g className="ill-necklace" aria-hidden="true">
              <circle cx="102" cy="86" r="4" />
              <circle cx="113" cy="94" r="4.2" />
              <circle cx="126" cy="99" r="4.5" />
              <circle cx="139" cy="94" r="4.2" />
              <circle cx="150" cy="86" r="4" />
            </g>
            <rect className="ill-brand-card" x="236" y="62" width="112" height="116" rx="8" />
            <path className="ill-line" d="M258 94h68M258 118h54M258 142h72" />
            <circle className="ill-button" cx="292" cy="82" r="6" />
            <path className="ill-bag ill-quilted" d="M266 190h66l8 44h-82l8-44z" />
            <path className="ill-line" d="M280 190c0-20 38-20 38 0" />
            <path className="ill-chain" d="M274 206c18 14 42 14 60 0" />
          </g>
        )}

        {variant === 'profile' && (
          <g>
            <rect className="ill-profile-card" x="56" y="48" width="142" height="184" rx="8" />
            <circle className="ill-avatar" cx="126" cy="92" r="25" />
            <path className="ill-line" d="M94 142h66M88 166h80M96 190h54" />
            <circle className="ill-button" cx="174" cy="190" r="5" />
            <path className="ill-coat ill-tweed" d="M248 70c10-9 58-9 68 0l17 28-11 8-8-14 4 36h-72l4-36-8 14-11-8 17-28z" />
            <path className="ill-trim" d="M250 76h64M246 128h72" />
            <path className="ill-line ill-seam" d="M264 70l18 28 18-28M282 98v28M254 126c16 8 40 8 56 0" />
            <path className="ill-pants" d="M258 134h50l11 32h-22l-9-20-9 20h-22l11-32z" />
            <circle className="ill-button" cx="282" cy="116" r="5" />
            <circle className="ill-button" cx="282" cy="136" r="5" />
            <g className="ill-necklace" aria-hidden="true">
              <circle cx="248" cy="172" r="4" />
              <circle cx="260" cy="180" r="4.2" />
              <circle cx="274" cy="185" r="4.5" />
              <circle cx="290" cy="186" r="4.8" />
              <circle cx="306" cy="185" r="4.5" />
              <circle cx="322" cy="180" r="4.2" />
              <circle cx="336" cy="172" r="4" />
            </g>
            <rect className="ill-brand-card" x="232" y="198" width="108" height="34" rx="8" />
            <circle className="ill-swatch-a" cx="252" cy="215" r="10" />
            <circle className="ill-swatch-b" cx="286" cy="215" r="10" />
            <circle className="ill-swatch-c" cx="320" cy="215" r="10" />
          </g>
        )}

        {variant === 'collection' && (
          <g>
            <rect className="ill-card-a" x="58" y="64" width="76" height="132" rx="8" />
            <path className="ill-line accent" d="M96 82v22M76 104h40" />
            <path className="ill-shirt ill-cream" d="M78 120c7-5 30-5 37 0l8 17-7 6-4-9 2 19 5 18H74l5-18 2-19-4 9-7-6 8-17z" />
            <path className="ill-line" d="M82 184h32" />
            <rect className="ill-card-b" x="160" y="44" width="118" height="186" rx="8" />
            <path className="ill-line accent" d="M219 58v24M184 82h70" />
            <path className="ill-coat ill-tweed" d="M186 96c10-8 56-8 66 0l16 27-11 8-8-14 4 36h-68l4-36-8 14-11-8 16-27z" />
            <path className="ill-trim" d="M188 102h62M184 153h70" />
            <path className="ill-line ill-seam" d="M204 96l15 26 15-26M219 122v30M194 148c16 7 34 7 50 0" />
            <path className="ill-pants" d="M196 160h46l10 34h-20l-8-20-8 20h-20l10-34z" />
            <circle className="ill-button" cx="219" cy="140" r="4" />
            <circle className="ill-button" cx="219" cy="158" r="4" />
            <g className="ill-necklace" aria-hidden="true">
              <circle cx="198" cy="88" r="3.8" />
              <circle cx="208" cy="95" r="4" />
              <circle cx="219" cy="99" r="4.2" />
              <circle cx="230" cy="95" r="4" />
              <circle cx="240" cy="88" r="3.8" />
            </g>
            <rect className="ill-card-c" x="304" y="72" width="58" height="124" rx="8" />
            <path className="ill-bag ill-quilted" d="M318 110h30l7 44h-44l7-44z" />
            <path className="ill-line" d="M324 110c0-14 18-14 18 0" />
            <path className="ill-shoe" d="M304 184c16-7 36-7 50 0 6 3 4 11-4 11h-44c-8 0-10-8-2-11z" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function MiniIllustration({ variant }: MiniIllustrationProps) {
  return (
    <div className={`mini-illustration ${variant}`} aria-hidden="true">
      <svg viewBox="0 0 120 96">
        <defs>
          <pattern id={`mini-quilt-${variant}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path className="mini-quilt-line" d="M0 12L12 0M-6 6L6-6M6 18L18 6" />
          </pattern>
          <pattern id={`mini-tweed-${variant}`} width="18" height="14" patternUnits="userSpaceOnUse">
            <rect className="mini-tweed-base" width="18" height="14" />
            <path className="mini-tweed-line light" d="M0 14L9 0M9 0l9 14M-5 14L4 0M14 0l9 14" />
            <path className="mini-tweed-line gold" d="M0 7h18M5 0v14M13 0v14" />
          </pattern>
        </defs>
        {variant === 'weather' && (
          <>
            <circle className="mini-sun" cx="34" cy="30" r="16" />
            <path className="mini-line" d="M62 36c6-12 28-10 30 8 10 1 17 8 17 18 0 11-8 18-21 18H42c-14 0-23-8-23-19 0-12 10-20 24-18 4-5 10-8 19-7z" />
            <path className="mini-accent" d="M42 82l-5 9M66 82l-5 9M90 82l-5 9" />
          </>
        )}

        {variant === 'brands' && (
          <>
            <rect className="mini-card" x="18" y="18" width="84" height="60" rx="8" />
            <path className="mini-line" d="M32 38h56M32 52h40M32 66h50" />
            <path className="mini-accent-fill" d="M88 16l5 11 12 4-12 4-5 11-5-11-12-4 12-4 5-11z" />
          </>
        )}

        {variant === 'palette' && (
          <>
            <circle className="mini-burgundy" cx="32" cy="34" r="18" />
            <circle className="mini-steel" cx="58" cy="48" r="18" />
            <circle className="mini-graphite" cx="84" cy="62" r="18" />
            <path className="mini-line" d="M20 78h78" />
          </>
        )}

        {variant === 'photo' && (
          <>
            <rect className="mini-card" x="22" y="14" width="76" height="68" rx="8" />
            <circle className="mini-head" cx="60" cy="30" r="9" />
            <path className="mini-burgundy-fill" d="M43 44h34l6 26H37l6-26z" />
            <path className="mini-line" d="M50 70h20" />
          </>
        )}

        {variant === 'assistant' && (
          <>
            <rect className="mini-card" x="18" y="20" width="84" height="56" rx="14" />
            <circle className="mini-steel" cx="42" cy="48" r="6" />
            <circle className="mini-burgundy" cx="60" cy="48" r="6" />
            <circle className="mini-graphite" cx="78" cy="48" r="6" />
            <path className="mini-accent" d="M36 76l-10 12" />
          </>
        )}

        {variant === 'closet' && (
          <>
            <rect className="mini-card" x="20" y="14" width="78" height="68" rx="8" />
            <path className="mini-line" d="M36 28h46M36 28v42M82 28v42M59 28v42" />
            <path className="mini-pattern-shape" d="M42 38h22l5 22H37l5-22z" fill={`url(#mini-tweed-${variant})`} />
            <path className="mini-accent" d="M72 40h14M72 52h12" />
          </>
        )}

        {variant === 'empty' && (
          <>
            <rect className="mini-card" x="24" y="22" width="72" height="54" rx="8" />
            <path className="mini-line" d="M60 30v10l-28 20h56L60 40" />
            <path className="mini-accent" d="M30 16v18M21 25h18" />
            <circle className="mini-steel" cx="88" cy="72" r="8" />
          </>
        )}

        {variant === 'look' && (
          <>
            <circle className="mini-head" cx="60" cy="22" r="9" />
            <path className="mini-pattern-shape" d="M44 36h32l10 24-14 7-4-13v28H52V54l-4 13-14-7 10-24z" fill={`url(#mini-tweed-${variant})`} />
            <path className="mini-line" d="M52 82h16M50 46h20" />
            <path className="mini-accent" d="M88 26l6 10 11 4-11 4-6 10-6-10-11-4 11-4 6-10z" />
          </>
        )}

        {variant === 'save' && (
          <>
            <rect className="mini-card" x="24" y="14" width="72" height="70" rx="8" />
            <path className="mini-burgundy-fill" d="M42 14h24v34L54 40 42 48V14z" />
            <path className="mini-line" d="M38 58h44M38 70h30" />
            <circle className="mini-steel" cx="86" cy="28" r="9" />
          </>
        )}

        {variant === 'score' && (
          <>
            <rect className="mini-card" x="18" y="18" width="84" height="62" rx="8" />
            <path className="mini-line" d="M32 66c8-26 48-26 56 0" />
            <path className="mini-accent" d="M60 66l20-24" />
            <circle className="mini-burgundy" cx="60" cy="66" r="7" />
            <path className="mini-line" d="M34 34h20M34 46h14" />
          </>
        )}

        {variant === 'shop' && (
          <>
            <path className="mini-pattern-shape" d="M28 36h58l8 44H20l8-44z" fill={`url(#mini-quilt-${variant})`} />
            <path className="mini-line" d="M40 36c0-20 34-20 34 0" />
            <path className="mini-accent" d="M88 16l6 11 12 4-12 4-6 11-6-11-12-4 12-4 6-11z" />
            <path className="mini-line" d="M39 58h36" />
          </>
        )}

        {variant === 'week' && (
          <>
            <rect className="mini-card" x="16" y="18" width="88" height="62" rx="8" />
            <path className="mini-line" d="M16 36h88M38 18v62M60 18v62M82 18v62" />
            <path className="mini-burgundy-fill" d="M23 48h10l3 16H20l3-16z" />
            <path className="mini-accent-fill" d="M46 46h9l3 18H43l3-18z" />
            <path className="mini-graphite" d="M68 48h9l3 16H65l3-16z" />
            <path className="mini-burgundy-fill" d="M90 46h6l4 18H86l4-18z" />
          </>
        )}
      </svg>
    </div>
  );
}
