import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../lib/theme';

export type IconName =
  | 'home' | 'bowl' | 'calendar' | 'gear' | 'check' | 'drop' | 'clock' | 'leaf'
  | 'moon' | 'sun' | 'heart' | 'plus' | 'minus' | 'info' | 'spark' | 'chevron';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color = C.text, strokeWidth = 1.8 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...p} d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />}
      {name === 'bowl' && (
        <>
          <Path {...p} d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" />
          <Path {...p} d="M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect {...p} x="3.5" y="5" width="17" height="15" rx="3" />
          <Path {...p} d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      )}
      {name === 'gear' && (
        <>
          <Circle {...p} cx="12" cy="12" r="3" />
          <Path
            {...p}
            d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"
          />
        </>
      )}
      {name === 'check' && <Path {...p} d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === 'drop' && <Path {...p} d="M12 3.5s6 6.5 6 10.5a6 6 0 0 1-12 0c0-4 6-10.5 6-10.5z" />}
      {name === 'clock' && (
        <>
          <Circle {...p} cx="12" cy="12" r="8.5" />
          <Path {...p} d="M12 7.5V12l3 2" />
        </>
      )}
      {name === 'leaf' && (
        <>
          <Path {...p} d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
          <Path {...p} d="M5 19l7-7" />
        </>
      )}
      {name === 'moon' && <Path {...p} d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z" />}
      {name === 'sun' && (
        <>
          <Circle {...p} cx="12" cy="12" r="4" />
          <Path {...p} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
      )}
      {name === 'heart' && <Path {...p} d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'minus' && <Path {...p} d="M5 12h14" />}
      {name === 'info' && (
        <>
          <Circle {...p} cx="12" cy="12" r="8.5" />
          <Path {...p} d="M12 11v5M12 8h.01" />
        </>
      )}
      {name === 'spark' && <Path {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />}
      {name === 'chevron' && <Path {...p} d="M9 6l6 6-6 6" />}
    </Svg>
  );
}
