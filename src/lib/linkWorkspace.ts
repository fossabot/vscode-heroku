import to from 'await-to-js'
import { sync as commandExistsSync } from 'command-exists'
import { ProgressLocation, window, workspace } from 'vscode'

import exec from '../helpers/exec'
import showProgressNotification from '../helpers/showProgressNotification'

import { HerokuApp } from './linkWorkspace.d'

export default async function() {
  // Check if "heroku" command alias is available
  if (!commandExistsSync('heroku')) {
    window.showErrorMessage(`The command "heroku" doesn't seem to be availble. Did you install Heroku CLI ?`)

    return
  }

  const cwd = workspace.workspaceFolders[0].uri.fsPath

  const [err1, herokuAppsNames] = await to(showProgressNotification(
    'Listing current Heroku apps...',
    async () => {
      const [err, herokuApps] = await to<string>(exec('heroku', ['apps', '--json'], { cwd }))
      if (err !== null) {
        window.showErrorMessage(`Something went wrong while trying to list your currents Heroku apps.`)

        throw new Error(err)
      }

      const herokuAppsJson = JSON.parse(herokuApps.trim()) as HerokuApp[]

      return herokuAppsJson.map(({ name }) => name)
    },
  ))
  if (err1 !== null) return

  const herokuAppName = await window.showQuickPick(herokuAppsNames)
  if (herokuAppName === undefined) return

  const [err2] = await to(showProgressNotification(
    'Listing current Heroku apps...',
    async () => {
      const [err] = await to<string>(exec('heroku', ['git:remote', '-a', herokuAppName], { cwd }))
      if (err !== null) {
        window.showErrorMessage(`Something went wrong while linking your Heroku app: "${herokuAppName}".`)

        return
      }
    },
  ))
  if (err2 !== null) return

  window.showInformationMessage(`Your current workspace is now linked to "${herokuAppName}" Heroku app.` +
                                `Please reload VS Code in order to enable the live Heroku status.` +
                                `You can do that by opening the Command Palette (CMD+MAJ+P / CTRL+MAJ+P)` +
                                `and look for the "Reload Window" command.`)
}