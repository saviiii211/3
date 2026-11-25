import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export type DetectivePose =
  | 'walk'
  | 'stand'
  | 'lookLeft'
  | 'lookRight'
  | 'sit'
  | 'exhale'
  | 'wipeBrow'
  | 'tipHat';

interface DetectiveSilhouetteProps {
  pose: DetectivePose;
  facing?: 'left' | 'right';
  rimSide?: 'left' | 'right';
  showDoorShadow?: boolean;
  className?: string;
}

export const DetectiveSilhouette: React.FC<DetectiveSilhouetteProps> = ({
  pose,
  facing = 'right',
  rimSide = 'left',
  showDoorShadow = false,
  className = '',
}) => {
  const reducedMotion = usePrefersReducedMotion();

  const isWalking = pose === 'walk' && !reducedMotion;
  const isSitting = pose === 'sit';
  const headRotate =
    pose === 'lookLeft'
      ? -12
      : pose === 'lookRight'
        ? 12
        : pose === 'tipHat' || pose === 'exhale'
          ? -5
          : pose === 'wipeBrow'
            ? -3
            : isSitting
              ? 4
              : 0;
  const hatFlipX = pose === 'lookLeft' ? -1 : 1;

  const torsoRotate = isSitting ? 6 : pose === 'exhale' ? -2 : 0;

  // Arm target poses
  const rightUpperArmAngle =
    pose === 'tipHat'
      ? -115
      : pose === 'wipeBrow'
        ? -125
        : isSitting
          ? -38
          : 4;
  const rightForearmAngle =
    pose === 'tipHat'
      ? -45
      : pose === 'wipeBrow'
        ? -65
        : isSitting
          ? -48
          : -8;

  const leftUpperArmAngle = isSitting ? -30 : -5;
  const leftForearmAngle = isSitting ? -50 : -6;

  // Rim highlight X offset facing light source
  const rimOffset = rimSide === 'left' ? -1.4 : 1.4;

  return (
    <svg
      viewBox="0 0 200 420"
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Long skewed floor shadow cast by doorway backlight */}
      {showDoorShadow && (
        <ellipse
          cx="152"
          cy="404"
          rx="95"
          ry="13"
          fill="rgba(0, 0, 0, 0.72)"
          transform="skewX(46)"
        />
      )}

      {/* Ground contact shadow under shoes */}
      <ellipse
        cx={isSitting ? 112 : 100}
        cy="405"
        rx={isSitting ? 46 : 38}
        ry="8"
        fill="rgba(0, 0, 0, 0.78)"
      />

      {/* Facing orientation container */}
      <g
        transform={facing === 'left' ? 'translate(200, 0) scale(-1, 1)' : undefined}
      >
        {/* Subtle vertical bounce on torso + legs when sitting/walking */}
        <motion.g
          animate={
            isWalking
              ? { y: [0, -3, 0, -3, 0] }
              : isSitting
                ? { y: 54 }
                : { y: 0 }
          }
          transition={
            isWalking
              ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.45, ease: 'easeOut' }
          }
        >
          {/* ================= LEFT LEG (background leg, hip 92, 232) ================= */}
          <motion.g
            style={{ originX: '92px', originY: '232px' }}
            animate={
              isWalking
                ? { rotate: [-22, 22, -22] }
                : isSitting
                  ? { rotate: -84 }
                  : { rotate: -3 }
            }
            transition={
              isWalking
                ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.45, ease: 'easeOut' }
            }
          >
            {/* Thigh */}
            <path
              d="M 81 230 L 103 230 L 100 318 L 82 318 Z"
              fill="#07080a"
            />
            {/* Shin + Shoe (knee 91, 316) */}
            <motion.g
              style={{ originX: '91px', originY: '316px' }}
              animate={isSitting ? { rotate: 86 } : { rotate: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <path
                d="M 82 314 L 100 314 L 97 394 L 84 394 Z"
                fill="#07080a"
              />
              {/* Dress Shoe */}
              <path
                d="M 82 392 L 101 392 L 114 401 L 82 403 Z"
                fill="#050608"
              />
            </motion.g>
          </motion.g>

          {/* ================= BACK ARM (Left arm, shoulder 84, 122) ================= */}
          <motion.g
            style={{ originX: '84px', originY: '122px' }}
            animate={
              isWalking
                ? { rotate: [14, -14, 14] }
                : { rotate: leftUpperArmAngle }
            }
            transition={
              isWalking
                ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.35, ease: 'easeOut' }
            }
          >
            <path
              d="M 75 118 L 93 122 L 88 184 L 71 182 Z"
              fill="#07080a"
            />
            <motion.g
              style={{ originX: '79px', originY: '182px' }}
              animate={{ rotate: leftForearmAngle }}
              transition={{ duration: 0.35 }}
            >
              <path
                d="M 71 180 L 88 182 L 86 236 L 73 235 Z"
                fill="#07080a"
              />
              <circle cx="80" cy="239" r="6" fill="#07080a" />
            </motion.g>
          </motion.g>

          {/* ================= RIGHT LEG (foreground leg, hip 108, 232) ================= */}
          <motion.g
            style={{ originX: '108px', originY: '232px' }}
            animate={
              isWalking
                ? { rotate: [22, -22, 22] }
                : isSitting
                  ? { rotate: -86 }
                  : { rotate: 4 }
            }
            transition={
              isWalking
                ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.45, ease: 'easeOut' }
            }
          >
            {/* Thigh */}
            <path
              d="M 96 230 L 118 230 L 115 318 L 97 318 Z"
              fill="#07080a"
            />
            {/* Shin + Shoe (knee 106, 316) */}
            <motion.g
              style={{ originX: '106px', originY: '316px' }}
              animate={isSitting ? { rotate: 88 } : { rotate: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <path
                d="M 97 314 L 115 314 L 112 394 L 99 394 Z"
                fill="#07080a"
              />
              <path
                d="M 97 392 L 117 392 L 130 401 L 97 403 Z"
                fill="#050608"
              />
            </motion.g>
          </motion.g>

          {/* ================= TORSO + TRENCH COAT (pivot hip 100, 224) ================= */}
          <motion.g
            style={{ originX: '100px', originY: '224px' }}
            animate={{ rotate: torsoRotate }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Rim Light Outline behind torso */}
            <path
              d="M 74 114 Q 100 104 126 114 L 131 210 L 138 308 L 62 310 L 70 210 Z"
              fill="none"
              stroke="#e9c98a"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              transform={`translate(${rimOffset}, 0)`}
            />
            {/* Main Trench Coat Body & Flowing Skirt */}
            <path
              d="M 74 114 Q 100 104 126 114 L 130 208 L 138 308 L 62 310 L 70 208 Z"
              fill="#07080a"
            />
            {/* Popped Trench Coat Collar */}
            <polygon points="82,112 91,92 108,92 118,112" fill="#07080a" />
            <polyline
              points="83,110 91,92"
              fill="none"
              stroke="#e9c98a"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            {/* Waist Trench Belt Hint */}
            <rect x="70" y="196" width="60" height="7" fill="#0b0d10" />
            <rect x="97" y="195" width="7" height="9" fill="none" stroke="#e9c98a" strokeOpacity="0.28" strokeWidth="1.2" />

            {/* ================= HEAD & FEDORA HAT (pivot neck 100, 96) ================= */}
            <motion.g
              style={{ originX: '100px', originY: '96px' }}
              animate={{ rotate: headRotate }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              {/* Head Silhouette (NO facial features) */}
              <ellipse cx="101" cy="76" rx="16" ry="20" fill="#07080a" />
              {/* Subtle nose/chin profile contour */}
              <path
                d="M 101 56 C 114 56, 118 68, 119 76 L 116 88 Q 108 96 98 96 L 86 90 Z"
                fill="#07080a"
              />
              {/* Rim highlight on head profile */}
              <path
                d="M 86 72 C 85 82, 88 90, 94 94"
                fill="none"
                stroke="#e9c98a"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                transform={`translate(${rimOffset}, 0)`}
              />

              {/* Fedora Hat (mirrored horizontally via scaleX when looking left) */}
              <motion.g
                style={{ originX: '100px', originY: '54px' }}
                animate={{ scaleX: hatFlipX }}
                transition={{ duration: 0.2 }}
              >
                {/* Fedora Brim */}
                <path
                  d="M 64 56 Q 100 62 138 52 Q 124 47 100 49 Q 78 50 64 56 Z"
                  fill="#07080a"
                />
                {/* Fedora Crown with classic noir dent */}
                <path
                  d="M 81 52 L 85 26 Q 97 30 104 25 L 118 28 L 122 51 Z"
                  fill="#07080a"
                />
                {/* Brim & Crown Rim Light */}
                <path
                  d="M 65 55 Q 78 50 84 48 L 85 26"
                  fill="none"
                  stroke="#e9c98a"
                  strokeOpacity="0.38"
                  strokeWidth="1.5"
                />
              </motion.g>
            </motion.g>

            {/* ================= FOREGROUND ARM (Right arm, shoulder 112, 122) ================= */}
            <motion.g
              style={{ originX: '112px', originY: '122px' }}
              animate={
                isWalking
                  ? { rotate: [-14, 14, -14] }
                  : { rotate: rightUpperArmAngle }
              }
              transition={
                isWalking
                  ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.35, ease: 'easeOut' }
              }
            >
              <path
                d="M 103 118 L 122 122 L 118 184 L 101 182 Z"
                fill="#07080a"
              />
              <path
                d="M 103 122 L 101 182"
                fill="none"
                stroke="#e9c98a"
                strokeOpacity="0.28"
                strokeWidth="1.3"
              />
              {/* Forearm (elbow 110, 182) */}
              <motion.g
                style={{ originX: '110px', originY: '182px' }}
                animate={{ rotate: rightForearmAngle }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <path
                  d="M 101 180 L 118 182 L 115 236 L 102 235 Z"
                  fill="#07080a"
                />
                <circle cx="108" cy="239" r="6" fill="#07080a" />
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </g>
    </svg>
  );
};
