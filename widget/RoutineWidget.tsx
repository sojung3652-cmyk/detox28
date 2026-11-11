// Home-screen widget (react-native-android-widget). Widgets render native RemoteViews, so only the
// library's *Widget primitives work here — no theme context, no hooks. Colors are the light tokens.
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { light } from '../theme/colors';
import type { WidgetSnapshot } from './snapshot';

const hex = (c: string) => c as `#${string}`;

export function RoutineWidget({ snap }: { snap: WidgetSnapshot }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: hex(light.bg),
        borderRadius: 16,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget text={snap.title} style={{ fontSize: 13, color: hex(light.sub), fontFamily: 'Pretendard-Medium' }} />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={snap.fastLine} style={{ fontSize: 18, color: hex(light.text), fontFamily: 'Pretendard-Medium' }} />
        {snap.fastSub ? <TextWidget text={snap.fastSub} style={{ fontSize: 12, color: hex(light.sub), fontFamily: 'Pretendard-Regular' }} /> : null}
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
        <TextWidget text={`루틴 ${snap.done} / ${snap.total}`} style={{ fontSize: 12, color: hex(light.sub), fontFamily: 'Pretendard-Regular', marginBottom: 4 }} />
        <FlexWidget style={{ flexDirection: 'row', width: 'match_parent' }}>
          {Array.from({ length: snap.total }).map((_, i) => (
            <FlexWidget
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                marginRight: i < snap.total - 1 ? 3 : 0,
                backgroundColor: hex(i < snap.done ? light.accent : light.line),
              }}
            />
          ))}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
