
import {Watcher} from "./watcher";

import {app} from "../electron";
import sf from "../util/sf";
import * as ospath from "path";

import * as invariant from "invariant";
import {filter, map, indexBy} from "underscore";

import * as actions from "../actions";

const TOKEN_FILE_NAME = "token.json";
const USERS_PATH = ospath.join(app.getPath("userData"), "users");

import {IStore} from "../types";

export function getTokenPath (userId: string) {
  return ospath.join(USERS_PATH, userId, TOKEN_FILE_NAME);
}

async function loadRememberedSessions (store: IStore) {
  // not using '**', as that would find arbitrarily deep files
  const tokenFiles = await sf.glob(`*/${TOKEN_FILE_NAME}`, {cwd: USERS_PATH, nodir: true});

  let sessions = await Promise.all(map(tokenFiles, async (tokenFile) => {
    try {
      const tokenFullPath = ospath.join(USERS_PATH, tokenFile);
      const content = await sf.readFile(tokenFullPath);
      return JSON.parse(content);
    } catch (e) {
      console.log(`Skipping ${tokenFile}: ${e.message}`); // tslint:disable-line:no-console
    }
  }));
  sessions = filter(sessions, (s) => !!s);

  if (sessions.length > 0) {
    const sessionsById = indexBy(sessions, (x) => x.me.id);
    store.dispatch(actions.sessionsRemembered(sessionsById));
  }
}

async function saveSession (store: IStore, userId: string, record: any) {
  invariant(typeof store === "object", "saveSession needs store object");

  const tokenPath = getTokenPath(userId);
  let oldRecord: any = {};
  try {
    const oldContent = await sf.readFile(tokenPath);
    oldRecord = JSON.parse(oldContent);
  } catch (e) {
    // muffin
  }

  const finalRecord = Object.assign({}, oldRecord, record, {lastConnected: Date.now()});
  const content = JSON.stringify(finalRecord);
  await sf.writeFile(tokenPath, content);

  // first time connecting?
  if (!oldRecord.lastConnected) {
    store.dispatch(actions.startOnboarding({}));
  }

  store.dispatch(actions.sessionUpdated({id: userId, record: finalRecord}));
}

export default function (watcher: Watcher) {
  watcher.on(actions.firstWindowReady, async (store, action) => {
    await loadRememberedSessions(store);
  });

  watcher.on(actions.forgetSessionRequest, async (store, action) => {
    const {id, username} = action.payload;
    store.dispatch(actions.openModal({
      title: ["prompt.forget_session.title"],
      message: ["prompt.forget_session.message", {username}],
      detail: ["prompt.forget_session.detail"],
      buttons: [
        {
          label: ["prompt.forget_session.action"],
          action: actions.forgetSession({id, username}),
          icon: "cross",
        },
        "cancel",
      ],
    }));
  });

  watcher.on(actions.forgetSession, async (store, action) => {
    const {id} = action.payload;

    const tokenPath = getTokenPath(String(id));
    await sf.wipe(tokenPath);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    const {key, me} = action.payload;
    await saveSession(store, String(me.id), {key, me});
  });
}
