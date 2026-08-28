/**
 * The owner panel's URL.
 *
 * Moved off /admin and out of the site navigation so it is not something a
 * shopper stumbles into. Be clear about what that is worth: the path is
 * compiled into the JavaScript this site serves to everyone, so anyone who
 * opens the bundle can read it. It is not access control and it does not
 * protect the panel — it only keeps it out of the way until real auth exists
 * (docs/PROMPT-ADDITIVE §4 plans an admin login).
 *
 * Change it here and the route, the redirect and any link follow.
 */
export const ADMIN_PATH = 'panel';
