import fabdeploytools.envs
from fabric.api import env, lcd, local, task
from fabdeploytools import helpers

import deploysettings as settings

env.key_filename = settings.SSH_KEY
fabdeploytools.envs.loadenv(settings.CLUSTER)
ROOT, DARJEELING = helpers.get_app_dirs(__file__)


@task
def pre_update(ref):
    with lcd(DARJEELING):
        local('git fetch')
        local('git fetch -t')
        local('git reset --hard %s' % ref)


@task
def update():
    with lcd(DARJEELING):
        local('npm install grunt-cli')
        local('npm install')
        local('cp -f settings_local.js.dist settings_local.js')
        local('cp -f ./src/lite/media/js/settings_local.js.dist '
              './src/lite/media/js/settings_local.js')
        local('./node_modules/grunt-cli/bin/grunt minify')


@task
def deploy():
    helpers.deploy(name='darjeeling',
                   app_dir='darjeeling',
                   env=settings.ENV,
                   cluster=settings.CLUSTER,
                   domain=settings.DOMAIN,
                   root=ROOT)
