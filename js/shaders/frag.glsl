/*
Author Frédéric Dilé
19/02/2022
frederic.dile@gmail.com
*/
uniform float time;
uniform float progress;
uniform vec3 ucolor;
uniform sampler2D unoise;
uniform float amp;

varying float vWave;

varying vec3 vViewPosition;

void main(){

    vec4 ncol = texture2D( unoise,vViewPosition.xy );
    ncol *= ncol;

    float vW = clamp( -vWave, 0., 2. );
    vec4 finalCol = vec4( mix( ucolor.rgb, ncol.rgb, vW * 1.3 ), 1.0 );

    gl_FragColor = finalCol;
    
}