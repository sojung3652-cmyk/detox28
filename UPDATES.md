# 업데이트 보내는 법 (EAS Update)

설치된 APK(preview 채널)는 앱을 열 때마다 업데이트를 확인해요.
새 업데이트가 있으면 백그라운드에서 받고 "새로운 버전이 준비됐어요" 카드를 보여줘요.
그냥 두어도 다음에 앱을 열 때 자동으로 적용돼요.

## 1. 업데이트 보내기 (JS·데이터 변경)

```bash
npx eas-cli@latest update --channel preview --message "알람 문구 수정"
```

메시지는 나중에 expo.dev에서 어떤 업데이트인지 알아보기 위한 메모예요.

## 2. APK 새로 빌드하기 (네이티브 변경)

```bash
npx eas-cli@latest build -p android --profile preview
```

새 APK는 폰에 다시 설치해야 해요. 기록은 앱 데이터에 남아 있어서 지워지지 않아요.
단, 앱을 삭제한 뒤 설치하면 지워지니 덮어서 설치해 주세요.

## 3. 무엇으로 보내야 하나요?

| 바꾼 것 | 방법 |
|---|---|
| `data/` 파일 (메뉴, 알람 문구, 프로그램, 장보기) | `eas update` |
| 화면·디자인·글자·색 (`app/`, `components/`, `theme/`) | `eas update` |
| 로직 (`lib/`), 그림 파일(이미지·폰트 추가) | `eas update` |
| `npx expo install`로 **새 라이브러리** 설치·버전 변경 | APK 새로 빌드 |
| `app.json`의 권한, 플러그인, 패키지명, 아이콘, 위젯 설정 | APK 새로 빌드 |
| Expo SDK 업그레이드 | APK 새로 빌드 |

## 4. 실수로 APK가 필요한 변경을 했는지 확인하기

이 앱은 runtimeVersion을 **fingerprint**로 정해요. 네이티브 쪽이 바뀌면 이 값이 자동으로 바뀌고,
값이 다른 업데이트는 기존 APK에 **설치되지 않아요** (앱이 망가지지 않고, 업데이트가 안 올 뿐이에요).

보내기 전에 확인하려면:

```bash
# 지금 프로젝트의 runtimeVersion (맨 앞 "runtimeVersion" 값)
npx expo-updates runtimeversion:resolve --platform android

# 마지막으로 만든 APK와 비교 (빌드 ID는 expo.dev 빌드 페이지 주소의 마지막 부분)
npx eas-cli@latest fingerprint:compare --build-id <빌드ID>
```

- 값이 **같으면** → `eas update`로 보내면 돼요.
- 값이 **다르면** → APK를 새로 빌드해야 해요. 그냥 `eas update`를 보내면 폰에는 도착하지 않아요.

앱의 설정 → 버전 정보에 보이는 "런타임 xxxxxxxx" 앞 8자리로도 지금 폰에 깔린 APK의 값을 확인할 수 있어요.
