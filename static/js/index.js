function display_modal(name) {
    document.getElementById(name).style.display = 'inherit';
}

function close_modal(name) {
    document.getElementById(name).style.display = 'none';
}

function add_subject(subject) {
    return '<li class="pure-menu-item">' +
             '<a href="#" id="' + subject.uid + '" class="pure-menu-link deletable_subject" style="color: #' + subject.color + '">' +
               subject.subject +
             '</a>' +
            '</li>';
}

let month_to_str = {
    '0': 'Jan.',
    '1': 'Fév.',
    '2': 'Mars',
    '3': 'Avr.',
    '4': 'Mai',
    '5': 'Juin',
    '6': 'Juil',
    '7': 'Août',
    '8': 'Sept',
    '9': 'Oct.',
    '10': 'Nov.',
    '11': 'Déc.',
};

function add_element(count, element) {
    return '<tr>' +
             '<td class="' + (count % 2 === 0 ? "date-even" : "date-odd") + '">' +
               '<div class="date-style">' +
                 element.day + ' ' + month_to_str[element.month] +
                 '<br/>' +
                 element.year +
               '</div>' +
             '</td>' +
             '<td>' +
               '<div class="title-style ' + (count % 2 === 0 ? "title-even" : "title-odd") + '">' +
                 element.title +
               '</div>' +
             '</td>' +
           '</tr>';
}

function add_message(message_list, element) {
    var count = message_list.childNodes.length;

    message_list.innerHTML += '<tr>' +
            '<td>' +
                '<div class="message-style ' + (count % 2 === 0 ? "message-even" : "message-odd") + '">' +
                    element.text +
                '</div>' +
            '</td>' +
        '</tr>';
}

function ajouter_subject(e) {
    let data = {
        subject: $('#ajouter_sujet').val(),
        color: $('#ajouter_couleur').text()
    };

    if (data.subject !== undefined && data.subject.trim() !== '') {
        $.post('/add_subject', data, function(r) {
            data.uid = r;

            $('#subjectlist').append(add_subject(data));
            $(".deletable_subject").contextmenu(subject_context);
            close_modal('modal-create');
        }).fail(function() {
            // TODO ERREUR SERVEUR!
        });
    }
}

function edit_subject(e) {
    let to_edit = $('#selected_subject').text();

    let data = {
        uid: to_edit,
        subject: $('#edit_sujet').val(),
        color: $('#edit_couleur').text()
    };

    console.log(data);

    if (data.subject === undefined || data.subject.trim() === '')
        return;

    $.post('/edit_subject', data, function(status) {
        if (status === 'NOT_EXIST')
        {
            $('#modal-message-title').text('Erreur');
            $('#modal-message-content').text("Ce sujet n'existe pas, il a peut-être été édité dans un autre tab");
        }
        else
        {
            var to_ed = document.getElementById(to_edit);

            to_ed.style.color = '#' + data.color;
            to_ed.text = data.subject;

            close_modal('modal-edit');
        }
    }).fail(function() {
        // TODO: ERREUR SERVEUR
    });
}

function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(,\s*\d+\.*\d+)?\)$/);
    return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function subject_context(e)
{
    console.log('Context on: ' + e.target.id);

    let context = $('#contextsujet');
    $('.contextmenu').css('display', 'none');

    context.css('display', 'block');
    context.css('left', e.pageX + 'px');
    context.css('top', e.pageY + 'px');

    if (e.target.id === '0')
        $('#delete_subject').css('display', 'none');
    else
        $('#delete_subject').css('display', 'block');

    $('#selected_subject').text(e.target.id);

    $('#edit_couleur').val(rgb2hex(e.target.style.color));
    $('#edit_couleur').css('background-color', e.target.style.color);
    $('#edit_sujet').val(e.target.text);

    e.preventDefault();
}

function add_context(e)
{
    if (e.target.id !== '')
        return;

    console.log('Ajouter context on: ' + e.target.id);

    let context = $('#contextleftmenu');
    $('.contextmenu').css('display', 'none');

    context.css('display', 'block');
    context.css('left', e.pageX + 'px');
    context.css('top', e.pageY + 'px');

    e.preventDefault();
}

function admin_context(e)
{
    if (e.target.id !== '')
        return;

    console.log('Admin context on: ' + e.target.id);

    let context = $('#contextadmin');
    $('.contextmenu').css('display', 'none');

    context.css('display', 'block');
    context.css('left', e.pageX + 'px');
    context.css('top', e.pageY + 'px');

    e.preventDefault();
}

function deploy()
{
    console.log("CALLING DEPLOY");

    $('#statustext').text('Déploiement en cours...');

    // TODO: FOR DEBUGGINB
    $.post('/is_deployed', null, function(data) {
        console.log('STATUS ACTUEL: ' + data);
        $.post('/do_deploy', null, function() { });

        $('#statustext').text('Le serveur redémarre...');
        var i = 0;

        function test_deployement()
        {
            if (i === 10)
            {
                $('#statustext').text('Échec');
                return;
            }

            $.post('/is_deployed', null, function(data) {
                console.log(data);

                if (data === 'True') {
                    $('#statustext').text('Terminé!');
                    location.reload();
                }
                else
                {
                    $('#statustext').text('Le serveur redémarre...' + (++i));
                    setTimeout(test_deployement, 1000);
                }
            }).fail(function() {
                $('#statustext').text('Le serveur redémarre...' + (++i));
                setTimeout(test_deployement, 1000);
            });
        }

        setTimeout(test_deployement, 1000);
    });
}

$(document).ready(function()
{
    document.querySelector('body').addEventListener('keydown', function(e) {
        if (e.keyCode === 27)
            $('.modal').css('display', 'none');
    });

    document.querySelector('textarea').addEventListener('keydown', function (e) {
        if (e.keyCode === 13)
        {
            if (!e.shiftKey)
            {
                e.preventDefault();

                let that = $(this);

                $.post('/add_entry', {'suid': $('#current_suid').text(), 'title': that.val()}, function(data) {
                    let json = JSON.parse(data);
                    let element_list = $('#elementlist');
                    element_list.append(add_element(element_list[0].rows.length, json));
                    that.val('');
                }).fail(function() {
                    // TODO: ERREUR SERVEUR
                });
            }
        }
    });

    $('#delete_subject').on('click', function() {
        let to_del = $('#selected_subject').text();

        $.post('/delete_subject', { 'uid': to_del}, function(data) {
            if (data === 'NOT_EXIST')
            {
                $('#modal-message-title').text('Erreur');
                $('#modal-message-content').text("Ce sujet n'existe pas, il a peut-être été édité dans un autre tab");
            }
            else if(data === 'ASSIGNED')
            {
                $('#modal-message-title').text('Erreur');
                $('#modal-message-content').text("Ce sujet est encore assigné, veuillez le vider d'abord");
            }
            else
            {
                var to_delete = document.getElementById(to_del).parentElement;
                to_delete.parentElement.removeChild(to_delete);
            }
        }).fail(function() {
            // TODO: ERREUR SERVEUR
        });
    });

    $('body').on('click', function() {
        $('.contextmenu').css('display', 'none');
    });

    $('.modal_overlay').on('click', function(e) {
        if (e.target.classList.contains('modal_overlay')) {
            close_modal(e.target.parentElement.id);
        }
    });

    $.post('/get_subjects', null, function(data) {
        let json = JSON.parse(data);
        let html = '';

        console.log('get_subjects -> ' + json);

        // TODO: Debugging?
        html += add_subject({
            uid: "0",
            subject: 'Journal',
            color: '4174c1'
        });

        for (let i = 0; i < json.length; i++)
            html += add_subject(json[i]);

        $('#subjectlist').html(html);

        var subjects = $(".deletable_subject");

        subjects.contextmenu(subject_context);
        subjects.on('click', function(e)
        {
            console.log('CLICKED');

            $('#current_suid').text(this.id);

            $.post('/get_entries', {'suid': this.id}, function(data) {
                let json = JSON.parse(data);
                let element_list = $('#elementlist');
                let html = '';
                let count = 0;

                console.log('get-entries -> ' + json);

                // TODO: For debugging
                html += add_element(count++, {
                    day: '10',
                    month: '0',
                    year: '2018',
                    title: 'Test'
                });

                for (let i = 0; i < json.length; i++)
                   html += add_element(count++, json[i]);

                element_list.html(html);
            }).fail(function() {
                // TODO: ERREUR SERVEUR
            });
        });

        $("#subjectlist").contextmenu(add_context);
        $("#icon-section").contextmenu(admin_context)
    }).fail(function() {
        // TODO: ERREUR SERVEUR
    });

    /*
        DEBUGGING


        add_element(element_list, {
            day: '10 Jan',
            year: '2018',
            title: 'Un titre très très long pour tester parce que bon voilà, il faut tester tous les cas, eh? Encore un peu, on n\'est toujours pas au bout de la case...'
        });

        add_element(element_list, {
            day: '2 Fév',
            year: '2018',
            title: 'J\'ai demandé à la lune'
        });

        add_element(element_list, {
            day: '31 Mar',
            year: '2018',
            title: 'Un titre très très long pour tester parce que bon voilà, il faut tester tous les cas, eh? Encore un peu, on n\'est toujours pas au bout de la case... Un titre très très long pour tester parce que bon voilà, il faut tester tous les cas, eh? Encore un peu, on n\'est toujours pas au bout de la case...'
        });

        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });
        add_element(element_list, { day: '31 Déc', year: '2018', title: 'test' });

        element_list.innerHTML += '<tr><td><div style="height: 110px"></div></td></tr>';

        let message_list = $('#messagelist')[0];

        add_message(message_list, {
            label: '',
            text: "J'ai senti que pour que la Prana marche mieux, il y avait un truc en particulier qui le bloquait: une sorte de boule en bas du ventre. Après cela allait mieux, et c'est surtout le cœur qui avait du mal à suivre avec l'eau."
        });

        add_message(message_list, {
            label: '',
            text: "J'ai prié pour de l'aide. Ce qui est venu, c'est le fait que j'ai été tourné à mon premier workshop; je me disais bien que le seul rêve que j'avais eu était bizarre de passer de droit à tourné. On est donc allé là: j'y ai vu une sorte de Spider-Man. Cela m'a rappelé le rêve bizarre de film hier, et je me suis senti soulagé. Il m'a dit de me reposer pour m'habituer à ce que ça va me faire. Puis j'avais des questions: Au vue des rêves récents, est-ce que je rêve seul? J'ai vu une tête hideuse... Il m'a dit de bien me reposer et d'observer ce que ça fait. Il me restait une dernière question, un truc que j'avais senti, qu'est-ce que cela fait le mélange de Prana et d'énergie universelle? Mais je suis sorti de cet état."
        });

        add_message(message_list, {
            label: '',
            text: "Il y a eu une salle de classe. J'avais pris ma trousse de l'époque, verte avec des tags. Il y avait Niels qui avait prévu de faire une école où il ferait littérature et art. Il avait deux cœurs, et j'étais surpris que c'était lui qui avait posé un problème financier dans sa famille à cause de sa commande de matériel de dessin... On est resté très tard, et le 'prof' voulait qu'on reste saluer le commandant, j'imaginais pour le remercier qu'on puisse rester plus longtemps. Je ne les ai pas suivis. J'ai pris une couverture et je suis allé vers la route. Je me suis dit que je pouvais glisser dedans comme je le fais des fois... Mais j'y suis allé normalement. J'ai voulu faire des courses, pour ça j'espérais pouvoir laisser le coussin dehors sans me le faire piquer. Il y avait tout un tas de vaches... je l'ai posé dans un coin. Après je suis monté et il y a eu ma mère face à plusieurs attractions, Disney, Snoop Dog, etc. Je ne savais pas quoi prendre, et il y a eu un certain 'blame' de ma mère pour ne pas savoir choisir, et une histoire d'avoir fait un mauvais score avec mon père. Je suis allé voir des sortes de jouets / boules sur les divers sujets, et j'étais désisté sur Snoop Dog. Sauf qu'en y allant la plupart rangeaient déjà. Ma mère m'a donné une carte de code qu'il fallait faire valider. Pour ça c'était comme au loto, il fallait aller au télétexte au numéro indiqué sur la carte. Elle savait que c'était un numéro gagnant de environ 70.-. Sauf qu'on avait beaucoup de mal à afficher l'information... Je me suis réveillé en ayant des souvenirs des rêves, mais plus je me réveillait physiquement avec ma conscience de tous les jours plus ces impressions disparaissaient. J'avais la tête qui tournait et je suis tombé en me levant! Puis je me suis souvenu de la scène de l'école, et j'ai pu reconstruire le reste..."
        });

        add_message(message_list, {
            label: '',
            text: "Il y a eu une histoire de cours. Je revenais comme de suisse-allemande en suisse-romande, et la prof voulait que je fasse un exposé sur Game of Thrones. Il y a eu ma mère avec des sortes de sachets avec chacun une année dessus. Je cherchais un appareil photo que j'avais utilisé une fois qui avait des options très pratiques. Elle disait que c'était quelque chose d'un voisin avait donné, coloré, etc pour une fête et que ce n'était pas bon. Je me souviens d'avoir jeté deux steak. Donc au final j'allais en classe et je n'avais rien pu avoir. Un peu avant j'avais vu quelques élèves de suisse-allemande qui me demandaient comment j'allais faire ma présentation; je disais qu'avec l'appareil photo et un miroir ça devrait marcher. Faute d'avoir ça, je me disais que par USB ça devrait aussi marcher. Là je marchais en direction de l'école, mais l'exposé était le jour-même. Si c'était le matin je n'avais aucune chance, si c'était l'après-midi j'aurais pu improviser quelque chose. Même là, un épisode de Game of Thrones c'est 40 minutes! Comment allais-je faire ça? Et pourquoi la prof voulait-elle que je fasse ça si tôt dans le trimestre et si tôt après mon arrivée? Je marchais à l'école et il y avait divers gens. Je me souviens de m'être tiré au sol pour aller un peu plus vite. Je me disais qu'en général je faisais ça dans les rêves. Je n'y croyais pas mais je me suis dit que ça valait la peine de regarder pour m'entraîner. Là surprise: ce sentiment de détresse par rapport à ce que demandait la prof était bien faux! On était bien dans un rêve! Je regardais ma main et elle était lourde, elle se collait au sol. Autour de moi les gens se sont soudain mis à avancer très vite... Alors je suis devenu lucide après un petit moment. Je voulais observer ce qui se passait. Il y a eu une sorte de masse bleue avec tout un tas de boules. Je suis comme sorti de cette masse et j'ai vu une route avec des voitures. Puis il y a eu des traits violets, j'étais au milieu de tout un tas de choses et je n'avais aucune idée de ce que c'était ou ce que je pouvais faire là-dedans. J'ai donc prié pour de l'aide. J'ai été tiré dans une direction, et il y avait des boules violettes, des sortes d'astéroïde gris qui tournaient sur eux-mêmes, et toujours cette sorte de masse bleu clair. Je n'osais pas trop regarder car je ne savais pas ce que ça ferait, ça fait des trucs. Puis... il m'a réveillé."
        });

        add_message(message_list, {
            label: '',
            text: "*Je me suis dit que tout ce que ça fait, c'est de s'approcher de cette barrière du sommeil.*"
        });

        add_message(message_list, {
            label: '',
            text: "Il y a eu un tram qui est arrivé, un enfant qui bloquait le passage avec son casque. Il y a une voiture qui s'est tordue dans la circulation. Il y a eu une navette qu'on a pris pour un arrêt. Il y a eu le chef d'Atracsys qui disait qu'il n'arrivait pas à trouver le positif dans le fait que lui et sa femme ne sont plus intéressés par un certains série: 'Moving on' est ce que j'ai répondu. Il a donné à ma grand-mère un paquet de livres du chat. J'ai vu ce qui était sensé être ma marraine mais ça m'a réveillé; elle avait plutôt la tête de ses filles et son visage était trop gris. Une histoire qu'il doit y avoir que 6 digits."
        });

        add_message(message_list, {
            label: '',
            text: "'Ma sœur peut stalker', me suis-je dit."
        });

        add_message(message_list, {
            label: '',
            text: "C'était un endroit qui devait être en France, mais ce qui est arrivé plus loin me dit que c'était plutôt du côté de Genève. Il y a eu avec la protection civile un parcourt à faire, des sacoches avec des messages. Il y a eu une chocolaterie où ma mère a mis à côté de ce qu'elle a donné à ma sœur... Il y a eu une boite de chocolats de Berne. Il y a eu une femme et je me demandais si je la connaissais? Il y a eu un livre à propos d'un film qui n'a jamais été fait dans cette ville. J'étais intéressé mais ma sœur l'avait déjà pris. J'avais pris autre chose. Sur le chemin il y a avait un livre comme ma sœur tombé par terre. Elle parlait d'une caméra qui le surveillait. J'ai dit ma phrase à l'envers. On a pris de boissons et ma mère avait mal compris les pris en francs. Ensuite il fallait remettre les messages dans des sacoches pour les groupes suivants. Quelqu'un écrivait sur des papiers, l'échelle a été mise sur la barrière de la route."
        });

        add_message(message_list, {
            label: '',
            text: "Avoir été sur mon bureau, et l'endroit était rempli d'eau?"
        });

        message_list.innerHTML += '<tr><td><div style="height: 110px"></div></td></tr>';
     */
});