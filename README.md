# これは何？

特定の IP が VPNGate のリストに存在する IP か否かを確かめる API サーバーです。

あらかじめ定義された秒数ごとにリストを取得します。

> [!NOTE] > `src/index.ts`から Interval を編集できます。
>
> ```ts
> const checkIntervalSec = 60 * 10; //60sec * 10min
> ```

# インストール・実行

1. このリポジトリを clone
2. `yarn`(または`npm i`)を実行し、パッケージをインストール
3. `yarn start`(または`npm run start`)を実行
4. `localhost:3000`にサーバーが建ちます!

# API

## `[GET] /list`

VPNGate から取得した IP 一覧を表示します。

## `[GET] /:ip`

IP アドレスが VPN であるか否かをチェックします。

# dev

```
npm install
npm run dev
```

```
open http://localhost:3000
```
