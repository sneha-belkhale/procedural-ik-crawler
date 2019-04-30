const FresnelShader = {
  vertexShader: `
  varying float vReflectionFactor;
  void main() {

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

    vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

    vec3 I = worldPosition.xyz - cameraPosition;
    vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );

    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  fragmentShader: `
  varying float vReflectionFactor;

  void main() {
    vec4 refractedColor = vec4( 0.019, 0.192, 0.231, 1.0 );
    vec4 reflectedColor = vec4( 0.847, 0.925, 0.933, 1.0 );

    gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );
  }`
};

export default FresnelShader;
