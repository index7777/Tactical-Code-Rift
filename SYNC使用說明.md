# A／B 兩地 GitHub 同步說明

遠端：`https://github.com/index7777/Tactical-Code-Rift.git`

## A 地首次上傳

在專案根目錄雙擊或執行：

```bat
sync-upload.bat A
```

腳本會初始化 Git、設定 `origin`、建立 `main`、提交現有檔案並推送。

## B 地首次下載

把 `sync-first-clone.bat` 複製到 B 地後執行，可指定空資料夾：

```bat
sync-first-clone.bat D:\Tactical-Code-Rift
```

若不指定路徑，預設下載到：

```text
%USERPROFILE%\Documents\Tactical-Code-Rift
```

## 日常作業順序

開始工作前：

```bat
sync-download.bat
```

完成工作後：

```bat
sync-upload.bat A
```

B 地則使用：

```bat
sync-upload.bat B
```

## 安全限制

- 只同步 `main` 分支。
- 下載只允許 fast-forward，不會自動 merge、rebase 或覆蓋本機檔案。
- 本機有未提交變更時，下載會停止。
- GitHub 有本機尚未下載的提交時，上傳會停止。
- `origin` 指向其他 Repository 時會停止。
- 同一時間只在一地編輯；換地點前先上傳，到另一地後先下載。

## 驗證腳本說明

```bat
sync-upload.bat --help
sync-download.bat --help
sync-first-clone.bat --help
```

首次推送若要求登入，依 Git Credential Manager 畫面登入 GitHub。若提交時顯示身分未設定，需先設定 Git 的 `user.name` 與 `user.email`。