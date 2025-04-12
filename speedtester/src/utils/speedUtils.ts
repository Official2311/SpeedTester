// Add this at the top of speedUtils.ts
export type NetworkInfo = {
    ip: string;
    isp: string;
    city: string;
    region: string;
    country: string;
  };

  export const testDownloadSpeed = async (
    onProgress?: (loaded: number, total: number, speed: number) => void
  ): Promise<number> => {
    const testFiles = [
      {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        // Don't specify size - we'll get it from headers
      }
    ];
  
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastLoaded = 0;
  
    for (const testFile of testFiles) {
      try {
        const response = await fetch(testFile.url, {
          cache: "no-store",
          mode: "cors"
        });
  
        if (!response.ok) continue;
        if (!response.body) throw new Error("No response body");
  
        // Get actual content length from headers
        const contentLength = parseInt(response.headers.get('Content-Length') || '0');
        if (contentLength === 0) {
          console.warn("Content-Length header missing or zero");
          continue;
        }
  
        const reader = response.body.getReader();
        let receivedLength = 0;
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          receivedLength += value.length;
          const currentTime = Date.now();
          const timeElapsed = (currentTime - lastProgressTime) / 1000;
  
          if (timeElapsed > 0.1) {
            const chunkSize = receivedLength - lastLoaded;
            const instantSpeed = (chunkSize * 8) / timeElapsed / 1024 / 1024;
            
            if (onProgress) {
              onProgress(receivedLength, contentLength, instantSpeed);
            }
  
            lastProgressTime = currentTime;
            lastLoaded = receivedLength;
          }
        }
  
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        const speedMbps = (receivedLength * 8) / duration / 1024 / 1024;
  
        console.log(`Downloaded ${receivedLength} bytes in ${duration} seconds`);
        return parseFloat(speedMbps.toFixed(2));
  
      } catch (error) {
        console.warn(`Failed with ${testFile.url}:`, error);
        continue;
      }
    }
  
    throw new Error("All test servers failed");
  };
  export const testUploadSpeed = async (
    onProgress?: (loaded: number, total: number, speed: number) => void
  ): Promise<number> => {
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalSize = 10 * 1024 * 1024; // 10MB total
    const chunks = Math.ceil(totalSize / chunkSize);
    const dummyData = new Uint8Array(chunkSize);
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastLoaded = 0;
    let uploaded = 0;
  
    try {
      // Using ReadableStream for upload progress
      const readableStream = new ReadableStream({
        start(controller) {
          const pushChunk = (chunkIndex: number) => {
            if (chunkIndex >= chunks) {
              controller.close();
              return;
            }
  
            const currentChunkSize = chunkIndex === chunks - 1 
              ? totalSize % chunkSize || chunkSize 
              : chunkSize;
  
            controller.enqueue(dummyData.subarray(0, currentChunkSize));
            uploaded += currentChunkSize;
  
            // Calculate progress and speed
            const currentTime = Date.now();
            const timeElapsed = (currentTime - lastProgressTime) / 1000; // in seconds
            
            if (timeElapsed > 0.1) { // Update at most every 100ms
              const chunkUploaded = uploaded - lastLoaded;
              const instantSpeed = (chunkUploaded * 8) / timeElapsed / 1024 / 1024; // Mbps
              
              if (onProgress) {
                onProgress(uploaded, totalSize, instantSpeed);
              }
  
              lastProgressTime = currentTime;
              lastLoaded = uploaded;
            }
  
            setTimeout(() => pushChunk(chunkIndex + 1), 0);
          };
  
          pushChunk(0);
        },
      });
  
      await fetch("https://httpbin.org/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: readableStream,
        // duplex: "half",
      });
  
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const bitsUploaded = uploaded * 8;
      const speedMbps = (bitsUploaded / duration / 1024 / 1024).toFixed(2);
  
      console.log(`Upload Size: ${uploaded} bytes`);
      console.log(`Upload Duration: ${duration} seconds`);
      console.log(`Upload Speed: ${speedMbps} Mbps`);
  
      return parseFloat(speedMbps);
    } catch (error) {
      console.error("Upload speed test failed:", error);
      return 0;
    }
  };
  
  export const fetchNetworkInfo = async (): Promise<NetworkInfo> => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return {
        ip: data.ip,
        isp: data.org,
        city: data.city,
        region: data.region,
        country: data.country_name,
      };
    } catch (err) {
      console.error("Network info fetch failed:", err);
      throw err;
    }
  };