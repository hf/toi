let g:LanguageClient_rootMarkers = {
        \ 'typescript': ['.vimrc'],
        \ }

let g:LanguageClient_serverCommands = {
                        \ 'typescript': ['typescript-language-server', '--stdio', '--tsserver-path', getcwd() . '/node_modules/.bin/tsserver'],
                        \ }
