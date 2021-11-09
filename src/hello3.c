// Compile with:
// emcc -o hello3.html hello3.c -O3 -s WASM=1 --shell-file html_template/shell_minimal.html -s USE_PTHREADS=1 -s ALLOW_MEMORY_GROWTH=1 -s NO_EXIT_RUNTIME=1  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" -s TOTAL_STACK=512mb -s TOTAL_MEMORY=1024mb  -s PTHREAD_POOL_SIZE=32

#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <emscripten/emscripten.h>
#include <math.h>
#include <unistd.h>

#define MAXTHRDS 8
typedef struct
{
   int thread_id;
   int start;
   int end;
   char *arr;
   int maxEscapeTime;
} Arg;

pthread_t callThd[MAXTHRDS];
pthread_mutex_t mutexsum;

float charsTofloat(char b3, char b2, char b1, char b0){
   float f;
   unsigned char b[] = {b3, b2, b1, b0};
   memcpy(&f, &b, sizeof(f));
   return f;
}

float numAtIdx(int idx, char * arr){
   return charsTofloat(arr[idx*4],arr[idx*4+1],arr[idx*4+2],arr[idx*4+3]); 
}

float distFromOrigin(float x, float y){
    return sqrt(x * x + y * y);
};

float calcEscapeTime(float xCart, float yCart, float maxEscapeTime){

    float escapeTime = 0;
    float oldX = xCart;
    float oldY = yCart;
    float newX, newY;

    while (distFromOrigin(oldX, oldY) < 2 && escapeTime < maxEscapeTime) {
        newX = (oldX * oldX) - (oldY * oldY) + xCart;
        newY = (2 * oldX * oldY) + yCart;

        oldX = newX;
        oldY = newY;

        escapeTime += 1;
    }

    return escapeTime;
};

struct Vec3
{
  int x[3];
};

void writeRgbFloat(struct Vec3 rgb, char* arrptr){
   float r = (float)(rgb.x[0]);
   float g = (float)(rgb.x[1]);
   float b = (float)(rgb.x[2]);
   float a = 255; 
   memcpy(arrptr + 0 * sizeof(r), &r, sizeof(r));
   memcpy(arrptr + 1 * sizeof(g), &g, sizeof(g));
   memcpy(arrptr + 2 * sizeof(b), &b, sizeof(b));
   memcpy(arrptr + 3 * sizeof(a), &a, sizeof(a));
}

struct Vec3 calRgbNum(int escapeTime, int maxEscapeTime){
   struct Vec3 ret;
   
    if (escapeTime <= 2) {
          ret.x[0] = 0;
         ret.x[1] = 0;
         ret.x[2] = 0;
         return ret;
    } else if (escapeTime == maxEscapeTime) {
          ret.x[0] = 0;
         ret.x[1] = 25;
         ret.x[2] = 0;
         return ret;
    }

    int redNum;
    int greenNum;
    int blueNum;
    int rgbIncrements = floor(((maxEscapeTime) / 7));
    int caseNum = floor(escapeTime / rgbIncrements);
    int remainNum = escapeTime % rgbIncrements;

    switch (caseNum) {
        case 0:
            redNum = 0;
            greenNum = floor(256 / rgbIncrements) * remainNum;
            blueNum = 0;
            break;
        case 1:
            redNum = 0;
            greenNum = 255;
            blueNum = floor(256 / rgbIncrements) * remainNum;
            break;
        case 2:
            redNum = floor(256 / rgbIncrements) * remainNum;
            greenNum = 255;
            blueNum = 255;
            break;
        case 3:
            redNum = floor(256 / rgbIncrements) * remainNum;
            greenNum = 0;
            blueNum = 255;
            break;
        case 4:
            redNum = 255;
            greenNum = floor(256 / rgbIncrements) * remainNum;
            blueNum = 255;
            break;
        case 5:
            redNum = 255;
            greenNum = floor(256 / rgbIncrements) * remainNum;
            blueNum = 0;
            break;
        case 6:
            redNum = 255;
            greenNum = 255;
            blueNum = floor(256 / rgbIncrements) * remainNum;
            break;
    }

   
   ret.x[0] = redNum;
   ret.x[1] = greenNum;
   ret.x[2] = blueNum;
    return ret;
};



void *calc_frac(void *arg)
{
   Arg *data = (Arg *)arg;
   int thread_id = data->thread_id;
   int start = data->start;
   int end = data->end;
   char *arr = data->arr;
   int maxEscapeTime = data->maxEscapeTime;

   struct Vec3 color;
   int cursor;
   printf("Running %d to %d\n", start, end);
   for(int i = start; i< end; i = i+4){
      cursor = i ;
      int x = (int) numAtIdx(cursor + 0, arr);
      int y = (int) numAtIdx(cursor + 1, arr);
      float xCart = numAtIdx(cursor + 2, arr);
      float yCart = numAtIdx(cursor + 3, arr);
      color = calRgbNum(calcEscapeTime(xCart, yCart, maxEscapeTime), maxEscapeTime);
   // pthread_mutex_lock(&mutexsum);
      writeRgbFloat(color, arr+cursor * 4);
   // pthread_mutex_unlock(&mutexsum);
      
   }
   pthread_exit((void *)0);
}

#ifdef __cplusplus
extern "C" {
#endif

EMSCRIPTEN_KEEPALIVE char * myFunction(int len, char * arr, int NUMTHRDS) {
   int cursor = 0;
   int maxEscapeTime = numAtIdx(cursor, arr);
   cursor += 1;

   // struct Vec3 color;
   // while(cursor < len){
   //    // printf("%f\n", numAtIdx(i, arr));
   //    int x = (int) numAtIdx(cursor + 0, arr);
   //    int y = (int) numAtIdx(cursor + 1, arr);
   //    float xCart = numAtIdx(cursor + 2, arr);
   //    float yCart = numAtIdx(cursor + 3, arr);
   //    color = calRgbNum(calcEscapeTime(xCart, yCart, maxEscapeTime), maxEscapeTime);
   //    writeRgbFloat(color, arr+cursor * 4);
   //    cursor += 4;
   // }


   pthread_mutex_init(&mutexsum, NULL);

   pthread_attr_t attr;
   pthread_attr_init(&attr);
   pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);

   int part = len / NUMTHRDS;
   int start = 1;
   int end = 1;

   Arg arg[NUMTHRDS];
   for (int i = 0; i < NUMTHRDS; i++)
   {
      end = (i == NUMTHRDS-1) ? len : (end + part);
      arg[i].thread_id = i;
      arg[i].start = start;
      arg[i].end = end;
      arg[i].maxEscapeTime = maxEscapeTime;
      arg[i].arr = arr;
      pthread_create(&callThd[i], &attr, calc_frac, (void *)&arg[i]);
      start = start + part;
   }

   pthread_attr_destroy(&attr);

   void *status;
   for (int i = 0; i < NUMTHRDS; i++)
   {
      pthread_join(callThd[i], &status);
      printf("joining %d\n", i);
   }

   pthread_mutex_destroy(&mutexsum);
   // pthread_exit(NULL);
    return "12345";
}

#ifdef __cplusplus
}
#endif
