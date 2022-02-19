
/*
Author Frédéric Dilé
19/02/2022
frederic.dile@gmail.com
*/
uniform float time;
uniform float progress;
uniform float freq;
uniform float amp;
uniform float offsetY;

varying vec3 vViewPosition;
varying float vWave;

#define PI 3.1415926538


void main() 
{   

    vec3 pos = position;
    vViewPosition = pos.xyz;

    // Good
    // pos.z += sin(sin(sin(sin((pos.y + offsetY ) * freq + time * progress )))) * amp;

    // More rounded
    // pos.z = -sin(sin((sin( (pos.y  + offsetY) * freq + time * progress ) + sin( pos.z * freq )))) * amp;

    // Half circles equation
    // Adapted from https://math.stackexchange.com/questions/2781755/semicircle-periodic-wave

    float phi = 0.;
    float R= 1.;
    float A= R * sin( phi );
    float B= R * cos( phi );
    float py = pos.y + offsetY + time * progress;
    float S = sign( sin( ( PI * py ) / 2. * B ) );
    float M = mod( py, 2. * B );

    pos.z = S * ( sqrt( pow( R, 2.) - pow( (M - B), 2. ) ) - A );

    vWave = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);

}



