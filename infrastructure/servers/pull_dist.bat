@ECHO Off
IF EXIST "dist" (
    ::If it does, yeet in and git pull
    cd dist
    git pull "ext::ssh -i ../.ssh/id_rsa git@github.com %%S battlecode/battlecode20-dist"
) ELSE (
    ::If directory doesnt exist, clone it
    git clone "ext::ssh -i .ssh/id_rsa git@github.com %%S battlecode/battlecode20-dist" dist
)

